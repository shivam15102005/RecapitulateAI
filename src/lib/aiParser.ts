import {
  ConceptSchema,
  FlashcardSchema,
  QuizQuestionSchema,
  type Flashcard,
  type QuizQuestion,
  type StudyConcept,
  type StudyPack,
  type StudyParserResult,
} from '../types/study';
import { formatStudyText } from './formatStudyText';

function stableId(prefix: string, value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}-${(hash >>> 0).toString(36)}`;
}

/**
 * Extracts the first complete JSON object while respecting quoted strings and escapes.
 * This avoids accidental brace matching inside explanations or code samples.
 */
export function extractBalancedJson(raw: string): string | null {
  if (!raw.trim()) return null;

  const withoutFences = raw
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < withoutFences.length; index += 1) {
    const character = withoutFences[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
      continue;
    }

    if (character === '{') {
      if (depth === 0) start = index;
      depth += 1;
    } else if (character === '}' && depth > 0) {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        return withoutFences.slice(start, index + 1);
      }
    }
  }

  return null;
}

function removeTrailingCommasOutsideStrings(value: string): string {
  let output = '';
  let inString = false;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (inString) {
      output += character;
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }

    if (character === '"') {
      inString = true;
      output += character;
      continue;
    }

    if (character === ',') {
      let lookAhead = index + 1;
      while (lookAhead < value.length && /\s/.test(value[lookAhead])) lookAhead += 1;
      if (value[lookAhead] === '}' || value[lookAhead] === ']') continue;
    }
    output += character;
  }
  return output;
}

function parseJsonWithTrailingCommaRepair(candidate: string): unknown {
  try {
    return JSON.parse(candidate) as unknown;
  } catch (firstError) {
    const repaired = removeTrailingCommasOutsideStrings(candidate);
    if (repaired === candidate) throw firstError;
    return JSON.parse(repaired) as unknown;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeFlashcards(items: unknown[], warnings: string[]): Flashcard[] {
  const valid: Flashcard[] = [];
  let discarded = 0;

  items.forEach((item, index) => {
    const parsed = FlashcardSchema.safeParse(item);
    if (!parsed.success) {
      discarded += 1;
      return;
    }
    const card = {
      ...parsed.data,
      question: formatStudyText(parsed.data.question),
      answer: formatStudyText(parsed.data.answer),
      hint: formatStudyText(parsed.data.hint),
      ...(parsed.data.topic ? { topic: formatStudyText(parsed.data.topic) } : {}),
    };
    const generatedId = stableId('fc', card.question.toLowerCase());
    const id = card.id || (valid.some((existing) => existing.id === generatedId) ? `${generatedId}-${index + 1}` : generatedId);
    valid.push({ ...card, id });
  });

  if (discarded > 0) {
    warnings.push(`${discarded} flashcard${discarded === 1 ? '' : 's'} could not be validated and ${discarded === 1 ? 'was' : 'were'} skipped.`);
  }
  return valid;
}

function normalizeQuiz(items: unknown[], warnings: string[]): QuizQuestion[] {
  const valid: QuizQuestion[] = [];
  let discarded = 0;

  items.forEach((item, index) => {
    const parsed = QuizQuestionSchema.safeParse(item);
    if (!parsed.success) {
      discarded += 1;
      return;
    }
    const question = {
      ...parsed.data,
      question: formatStudyText(parsed.data.question),
      options: parsed.data.options.map(formatStudyText),
      explanation: formatStudyText(parsed.data.explanation),
      hint: formatStudyText(parsed.data.hint),
    };
    const generatedId = stableId('quiz', question.question.toLowerCase());
    const id = question.id || (valid.some((existing) => existing.id === generatedId) ? `${generatedId}-${index + 1}` : generatedId);
    valid.push({ ...question, id });
  });

  if (discarded > 0) {
    warnings.push(`${discarded} quiz question${discarded === 1 ? '' : 's'} could not be validated and ${discarded === 1 ? 'was' : 'were'} skipped.`);
  }
  return valid;
}

function normalizeConcepts(items: unknown[], warnings: string[]): StudyConcept[] {
  const valid: StudyConcept[] = [];
  let discarded = 0;

  items.forEach((item, index) => {
    const parsed = ConceptSchema.safeParse(item);
    if (!parsed.success) {
      discarded += 1;
      return;
    }
    const concept = {
      ...parsed.data,
      title: formatStudyText(parsed.data.title),
      description: formatStudyText(parsed.data.description),
      keyPoints: parsed.data.keyPoints.map(formatStudyText),
      ...(parsed.data.selfCheck ? { selfCheck: formatStudyText(parsed.data.selfCheck) } : {}),
    };
    const generatedId = stableId('concept', concept.title.toLowerCase());
    const id = concept.id || (valid.some((existing) => existing.id === generatedId) ? `${generatedId}-${index + 1}` : generatedId);
    valid.push({ ...concept, id });
  });

  if (discarded > 0) {
    warnings.push(`${discarded} concept${discarded === 1 ? '' : 's'} could not be validated and ${discarded === 1 ? 'was' : 'were'} skipped.`);
  }
  return valid;
}

export function parseStudyResponse(rawResponse: string): StudyParserResult {
  const warnings: string[] = [];
  const emptyResult = (error: string): StudyParserResult => ({
    status: 'error',
    warnings,
    error,
    rawResponse,
    discarded: { flashcards: 0, quiz: 0, conceptChecklist: 0 },
  });

  if (!rawResponse.trim()) {
    return emptyResult('The AI returned an empty response. Try again or switch to another provider.');
  }

  const candidate = extractBalancedJson(rawResponse);
  if (!candidate) {
    return emptyResult('No complete JSON object could be found in the AI response.');
  }

  let parsedValue: unknown;
  try {
    parsedValue = parseJsonWithTrailingCommaRepair(candidate);
  } catch {
    return emptyResult('The AI response contained malformed JSON that could not be repaired.');
  }

  const record = asRecord(parsedValue);
  if (!record) {
    return emptyResult('The AI response must be a JSON object containing flashcards, quiz, and conceptChecklist arrays.');
  }

  if (!Array.isArray(record.flashcards)) warnings.push('The flashcards field was missing or was not an array.');
  if (!Array.isArray(record.quiz)) warnings.push('The quiz field was missing or was not an array.');
  if (!Array.isArray(record.conceptChecklist)) warnings.push('The conceptChecklist field was missing or was not an array.');

  const flashcards = normalizeFlashcards(asArray(record.flashcards), warnings);
  const quiz = normalizeQuiz(asArray(record.quiz), warnings);
  const conceptChecklist = normalizeConcepts(asArray(record.conceptChecklist), warnings);

  if (flashcards.length + quiz.length + conceptChecklist.length === 0) {
    return {
      ...emptyResult('The AI response did not contain any valid flashcards, quiz questions, or concepts.'),
      discarded: {
        flashcards: asArray(record.flashcards).length,
        quiz: asArray(record.quiz).length,
        conceptChecklist: asArray(record.conceptChecklist).length,
      },
    };
  }

  const title = typeof record.title === 'string' && record.title.trim()
    ? formatStudyText(record.title.trim().slice(0, 160))
    : 'Your study pack';
  const summary = typeof record.summary === 'string' ? formatStudyText(record.summary.trim().slice(0, 1200)) : undefined;

  const data: StudyPack = {
    title,
    ...(summary ? { summary } : {}),
    flashcards,
    quiz,
    conceptChecklist,
  };

  const discarded = {
    flashcards: asArray(record.flashcards).length - flashcards.length,
    quiz: asArray(record.quiz).length - quiz.length,
    conceptChecklist: asArray(record.conceptChecklist).length - conceptChecklist.length,
  };
  const status = warnings.length > 0 || Object.values(discarded).some((count) => count > 0) ? 'partial' : 'success';

  return { status, data, warnings, rawResponse, discarded };
}

export function mergeStudyPacks(previous: StudyPack, incoming: StudyPack): StudyPack {
  const mergeById = <T extends { id: string }>(oldItems: T[], newItems: T[]): T[] => {
    const existing = new Map(oldItems.map((item) => [item.id, item]));
    const merged = newItems.map((item) => ({ ...(existing.get(item.id) || {}), ...item } as T));
    const incomingIds = new Set(newItems.map((item) => item.id));
    const preserved = oldItems.filter((item) => !incomingIds.has(item.id));
    return [...merged, ...preserved];
  };

  return {
    title: incoming.title || previous.title,
    summary: incoming.summary || previous.summary,
    flashcards: mergeById(previous.flashcards, incoming.flashcards),
    quiz: mergeById(previous.quiz, incoming.quiz),
    conceptChecklist: mergeById(previous.conceptChecklist, incoming.conceptChecklist),
  };
}
