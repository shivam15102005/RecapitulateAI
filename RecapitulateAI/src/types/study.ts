import { z } from 'zod';

export const DifficultySchema = z.enum(['Beginner', 'Intermediate', 'Advanced']);

// These fallbacks keep the hint controls usable for older saved packs or model
// responses that omit a hint. New generations are instructed to provide a
// specific, answer-neutral hint for every item.
const DEFAULT_FLASHCARD_HINT = 'Recall the key term, process, or relationship before revealing the full answer.';
const DEFAULT_QUIZ_HINT = 'Recall the concept being tested, then compare each option against it.';
export type Difficulty = z.infer<typeof DifficultySchema>;

export const FlashcardSchema = z.object({
  id: z.string().trim().min(1).optional(),
  question: z.string().trim().min(3).max(500),
  answer: z.string().trim().min(1).max(1200),
  hint: z.string().trim().min(1).max(400).catch(DEFAULT_FLASHCARD_HINT).default(DEFAULT_FLASHCARD_HINT),
  topic: z.string().trim().max(120).optional(),
});

export const QuizQuestionSchema = z.object({
  id: z.string().trim().min(1).optional(),
  question: z.string().trim().min(5).max(700),
  options: z.array(z.string().trim().min(1).max(250)).min(2).max(6),
  correctAnswerIndex: z.number().int().min(0).max(5),
  explanation: z.string().trim().min(1).max(1000),
  hint: z.string().trim().min(1).max(400).catch(DEFAULT_QUIZ_HINT).default(DEFAULT_QUIZ_HINT),
  conceptId: z.string().trim().max(120).optional(),
}).superRefine((question, context) => {
  if (question.correctAnswerIndex >= question.options.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'correctAnswerIndex must point to an existing option',
      path: ['correctAnswerIndex'],
    });
  }
});

export const ConceptSchema = z.object({
  id: z.string().trim().min(1).optional(),
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().min(1).max(1000),
  keyPoints: z.array(z.string().trim().min(1).max(260)).max(8).default([]),
  selfCheck: z.string().trim().max(500).optional(),
});

export type Flashcard = z.infer<typeof FlashcardSchema> & { id: string };
export type QuizQuestion = z.infer<typeof QuizQuestionSchema> & { id: string };
export type StudyConcept = z.infer<typeof ConceptSchema> & { id: string };

export const StudyPackSchema = z.object({
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().max(1200).optional(),
  flashcards: z.array(FlashcardSchema),
  quiz: z.array(QuizQuestionSchema),
  conceptChecklist: z.array(ConceptSchema),
});

export type StudyPack = {
  title: string;
  summary?: string;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  conceptChecklist: StudyConcept[];
};

export type ParseStatus = 'success' | 'partial' | 'error';

export interface StudyParserResult {
  status: ParseStatus;
  data?: StudyPack;
  warnings: string[];
  error?: string;
  rawResponse: string;
  discarded: {
    flashcards: number;
    quiz: number;
    conceptChecklist: number;
  };
}

export interface StudyGenerationRequest {
  notes: string;
  difficulty: Difficulty;
  flashcardCount: number;
  quizCount: number;
  mode?: 'generate' | 'refine';
  refinement?: string;
  currentPack?: StudyPack;
  faultMode?: string;
}

export interface SavedStudySession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  data: StudyPack;
  flashcardMastery: Record<string, 'known' | 'review'>;
  conceptMastery: Record<string, boolean>;
}

export interface GeneratorState {
  status: 'idle' | 'loading' | 'success' | 'partial' | 'error' | 'cancelled';
  data: StudyPack | null;
  error: string | null;
  warnings: string[];
  rawResponse: string;
  isSlowLoading: boolean;
  provider: string | null;
}
