import { useCallback, useEffect, useState } from 'react';
import { StudyPackSchema, type SavedStudySession, type StudyPack } from '../types/study';

const STORAGE_KEY = 'recapitulate-ai:sessions:v1';
const MAX_SAVED_SESSIONS = 12;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStudyPack(value: unknown): value is StudyPack {
  const parsed = StudyPackSchema.safeParse(value);
  if (!parsed.success) return false;
  return parsed.data.flashcards.every((item) => typeof item.id === 'string' && item.id.length > 0)
    && parsed.data.quiz.every((item) => typeof item.id === 'string' && item.id.length > 0)
    && parsed.data.conceptChecklist.every((item) => typeof item.id === 'string' && item.id.length > 0);
}

function cleanBooleanMap(value: unknown): Record<string, boolean> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean'));
}

function cleanMasteryMap(value: unknown): Record<string, 'known' | 'review'> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, 'known' | 'review'] => entry[1] === 'known' || entry[1] === 'review'));
}

function readSessions(): SavedStudySession[] {
  try {
    const serialized = window.localStorage.getItem(STORAGE_KEY);
    if (!serialized) return [];
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) return [];

    const valid: SavedStudySession[] = [];
    for (const item of parsed) {
      if (!isRecord(item) || typeof item.id !== 'string' || !isStudyPack(item.data)) continue;
      const data = StudyPackSchema.parse(item.data) as StudyPack;
      const updatedAt = typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString();
      valid.push({
        id: item.id,
        title: typeof item.title === 'string' && item.title.trim() ? item.title : data.title,
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : updatedAt,
        updatedAt,
        data,
        flashcardMastery: cleanMasteryMap(item.flashcardMastery),
        conceptMastery: cleanBooleanMap(item.conceptMastery),
      });
    }
    return valid.slice(0, MAX_SAVED_SESSIONS);
  } catch (error) {
    console.warn('Could not read saved RecapitulateAI sessions:', error);
    return [];
  }
}

function persistSessions(sessions: SavedStudySession[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_SAVED_SESSIONS)));
  } catch (error) {
    console.warn('Could not persist RecapitulateAI sessions. Browser storage may be full or disabled:', error);
  }
}

export function useLocalStorageDecks() {
  const [sessions, setSessions] = useState<SavedStudySession[]>(() => {
    if (typeof window === 'undefined') return [];
    return readSessions();
  });

  useEffect(() => {
    persistSessions(sessions);
  }, [sessions]);

  const saveSession = useCallback((
    data: StudyPack,
    flashcardMastery: Record<string, 'known' | 'review'>,
    conceptMastery: Record<string, boolean>,
    sessionId = 'active-study-session',
  ) => {
    const now = new Date().toISOString();
    setSessions((current) => {
      const existing = current.find((session) => session.id === sessionId);
      const nextSession: SavedStudySession = {
        id: sessionId,
        title: data.title || 'Untitled study pack',
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        data,
        flashcardMastery,
        conceptMastery,
      };
      const next = [nextSession, ...current.filter((session) => session.id !== sessionId)];
      persistSessions(next);
      return next.slice(0, MAX_SAVED_SESSIONS);
    });
  }, []);

  const restoreSession = useCallback((sessionId: string) => {
    return sessions.find((session) => session.id === sessionId) || null;
  }, [sessions]);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions((current) => {
      const next = current.filter((session) => session.id !== sessionId);
      persistSessions(next);
      return next;
    });
  }, []);

  return { sessions, saveSession, restoreSession, deleteSession };
}
