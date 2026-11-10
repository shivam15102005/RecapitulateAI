import { useCallback, useRef, useState } from 'react';
import { mergeStudyPacks, parseStudyResponse } from '../lib/aiParser';
import type { GeneratorState, StudyGenerationRequest } from '../types/study';

const initialState: GeneratorState = {
  status: 'idle',
  data: null,
  error: null,
  warnings: [],
  rawResponse: '',
  isSlowLoading: false,
  provider: null,
};

interface ApiResponse {
  rawText?: string;
  provider?: string;
  error?: string;
  diagnostic?: string;
}

export function useStudyGenerator() {
  const [state, setState] = useState<GeneratorState>(initialState);
  const activeRequestIdRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const slowTimerRef = useRef<number | null>(null);
  const hardTimerRef = useRef<number | null>(null);
  const timedOutRequestRef = useRef<number | null>(null);
  const lastRequestRef = useRef<StudyGenerationRequest | null>(null);

  const clearTimers = useCallback(() => {
    if (slowTimerRef.current !== null) window.clearTimeout(slowTimerRef.current);
    if (hardTimerRef.current !== null) window.clearTimeout(hardTimerRef.current);
    slowTimerRef.current = null;
    hardTimerRef.current = null;
  }, []);

  const generate = useCallback(async (payload: StudyGenerationRequest) => {
    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;
    controllerRef.current?.abort();
    clearTimers();

    const controller = new AbortController();
    controllerRef.current = controller;
    timedOutRequestRef.current = null;
    lastRequestRef.current = payload;

    setState((previous) => ({
      ...previous,
      status: 'loading',
      error: null,
      warnings: [],
      rawResponse: '',
      isSlowLoading: false,
      provider: null,
    }));

    slowTimerRef.current = window.setTimeout(() => {
      if (requestId !== activeRequestIdRef.current) return;
      setState((previous) => ({ ...previous, isSlowLoading: true }));
    }, 6_000);

    hardTimerRef.current = window.setTimeout(() => {
      if (requestId !== activeRequestIdRef.current) return;
      timedOutRequestRef.current = requestId;
      controller.abort();
    }, 20_000);

    try {
      const response = await fetch('/api/study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (requestId !== activeRequestIdRef.current) return;
      if (timedOutRequestRef.current === requestId) throw new Error('Client timeout reached.');

      let body: ApiResponse;
      try {
        body = (await response.json()) as ApiResponse;
      } catch {
        body = { error: 'The API server returned an unreadable response.' };
      }

      if (requestId !== activeRequestIdRef.current) return;
      if (timedOutRequestRef.current === requestId) throw new Error('Client timeout reached.');

      if (!response.ok) {
        const diagnostic = [body.error, body.diagnostic].filter(Boolean).join('\n\n');
        setState((previous) => ({
          ...previous,
          status: 'error',
          error: body.error || `Request failed with HTTP ${response.status}.`,
          rawResponse: JSON.stringify(body, null, 2),
          isSlowLoading: false,
          warnings: [],
        }));
        if (diagnostic && diagnostic !== body.error) {
          setState((previous) => previous.status === 'error'
            ? { ...previous, rawResponse: diagnostic }
            : previous);
        }
        return;
      }

      if (typeof body.rawText !== 'string') {
        setState((previous) => ({
          ...previous,
          status: 'error',
          error: 'The API response did not include AI text to parse.',
          rawResponse: JSON.stringify(body, null, 2),
          isSlowLoading: false,
        }));
        return;
      }

      const parsed = parseStudyResponse(body.rawText);
      if (requestId !== activeRequestIdRef.current) return;

      if (parsed.status === 'error' || !parsed.data) {
        setState((previous) => ({
          ...previous,
          status: 'error',
          error: parsed.error || 'The AI response could not be converted into a study pack.',
          warnings: parsed.warnings,
          rawResponse: body.rawText || '(empty response)',
          isSlowLoading: false,
          provider: body.provider || null,
        }));
        return;
      }

      const committedData = payload.mode === 'refine' && payload.currentPack
        ? mergeStudyPacks(payload.currentPack, parsed.data)
        : parsed.data;

      if (requestId !== activeRequestIdRef.current) return;
      setState((previous) => ({
        ...previous,
        status: parsed.status,
        data: committedData,
        error: null,
        warnings: parsed.warnings,
        rawResponse: body.rawText || '',
        isSlowLoading: false,
        provider: body.provider || null,
      }));
    } catch (error) {
      if (requestId !== activeRequestIdRef.current) return;

      if (timedOutRequestRef.current === requestId) {
        setState((previous) => ({
          ...previous,
          status: 'error',
          error: 'This request exceeded the 20-second time limit. Retry the request or use shorter notes.',
          rawResponse: previous.rawResponse || 'Client timeout: request aborted after 20 seconds.',
          isSlowLoading: false,
        }));
      } else if (error instanceof Error && error.name === 'AbortError') {
        setState((previous) => ({
          ...previous,
          status: 'cancelled',
          error: 'The request was cancelled.',
          isSlowLoading: false,
        }));
      } else {
        setState((previous) => ({
          ...previous,
          status: 'error',
          error: error instanceof Error ? error.message : 'A network error prevented the study pack from loading.',
          rawResponse: error instanceof Error ? error.stack || error.message : String(error),
          isSlowLoading: false,
        }));
      }
    } finally {
      if (requestId === activeRequestIdRef.current) {
        clearTimers();
        controllerRef.current = null;
      }
    }
  }, [clearTimers]);

  const cancel = useCallback(() => {
    const currentId = activeRequestIdRef.current;
    if (!controllerRef.current) return;
    activeRequestIdRef.current += 1;
    timedOutRequestRef.current = null;
    controllerRef.current.abort();
    controllerRef.current = null;
    clearTimers();
    setState((previous) => ({
      ...previous,
      status: 'cancelled',
      error: 'The request was cancelled. Your input and previous study pack are unchanged.',
      isSlowLoading: false,
    }));
    void currentId;
  }, [clearTimers]);

  const retry = useCallback(() => {
    if (lastRequestRef.current) void generate(lastRequestRef.current);
  }, [generate]);

  const restore = useCallback((data: NonNullable<GeneratorState['data']>) => {
    activeRequestIdRef.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;
    clearTimers();
    setState({
      status: 'success',
      data,
      error: null,
      warnings: [],
      rawResponse: '',
      isSlowLoading: false,
      provider: 'Saved session',
    });
  }, [clearTimers]);

  return { state, generate, cancel, retry, restore, lastRequest: lastRequestRef };
}
