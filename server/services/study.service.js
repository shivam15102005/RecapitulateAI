import { env } from '../config/env.js';
import { getProviderPlan } from './ai/providerRegistry.js';
import { buildSystemPrompt, buildUserPrompt } from './ai/prompts.js';

function createProviderTimeout(providerName, timeoutMs, parentSignal) {
  const controller = new AbortController();
  const abortFromParent = () => controller.abort(parentSignal?.reason);

  if (parentSignal?.aborted) {
    abortFromParent();
  } else {
    parentSignal?.addEventListener('abort', abortFromParent, { once: true });
  }

  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  timeout.unref?.();

  return {
    signal: controller.signal,
    clear: () => {
      clearTimeout(timeout);
      parentSignal?.removeEventListener('abort', abortFromParent);
    },
    timeoutMessage: `${providerName} request timed out after ${Math.max(1, Math.round(timeoutMs / 1000))} seconds.`,
  };
}

function normalizePromptInput(input) {
  return {
    notes: input.notes,
    difficulty: input.difficulty,
    flashcardCount: input.flashcardCount,
    quizCount: input.quizCount,
    mode: input.mode,
    refinement: input.refinement,
    currentPack: input.currentPack && typeof input.currentPack === 'object'
      ? input.currentPack
      : null,
  };
}

export async function generateStudyContent(input, { signal } = {}) {
  const providerPlan = getProviderPlan();

  if (providerPlan.length === 0) {
    return {
      ok: false,
      statusCode: 503,
      error: 'No AI provider is configured. Add GEMINI_API_KEY, GROQ_API_KEY, OPENAI_API_KEY, or OLLAMA_MODEL to the server-side .env file.',
      diagnostic: 'Provider configuration was empty.',
    };
  }

  const promptInput = normalizePromptInput(input);
  const promptArgs = {
    systemPrompt: buildSystemPrompt(),
    userPrompt: buildUserPrompt(promptInput),
  };
  const providerErrors = [];
  const requestDeadline = Date.now() + env.providerTimeoutMs;

  for (const provider of providerPlan) {
    if (signal?.aborted) {
      return { ok: false, statusCode: 499, error: 'The client cancelled the request.' };
    }

    const remainingMs = requestDeadline - Date.now();
    if (remainingMs <= 0) {
      providerErrors.push('Provider fallback stopped because the total AI request time budget was exhausted.');
      break;
    }

    const timeout = createProviderTimeout(provider.name, remainingMs, signal);

    try {
      const rawText = await provider.generate({ ...promptArgs, signal: timeout.signal });
      timeout.clear();
      return {
        ok: true,
        data: { rawText, provider: provider.name },
      };
    } catch (error) {
      timeout.clear();
      if (signal?.aborted) {
        return { ok: false, statusCode: 499, error: 'The client cancelled the request.' };
      }
      const reason = error?.name === 'AbortError'
        ? timeout.timeoutMessage
        : error?.message || 'Unknown provider error.';
      providerErrors.push(`${provider.name}: ${reason}`);
    }
  }

  return {
    ok: false,
    statusCode: 502,
    error: 'All configured AI providers failed. Check your server-side API key, model access, and network connection.',
    diagnostic: providerErrors.join('\n'),
  };
}
