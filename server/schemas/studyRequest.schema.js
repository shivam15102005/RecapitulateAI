import { z } from 'zod';

export const faultModeSchema = z.enum([
  'none',
  'partial',
  'malformed',
  'trailing_comma',
  'empty',
  'invalid_types',
  'server_error',
  'slow',
]);

export const studyRequestSchema = z.object({
  notes: z.string().trim().min(1, 'Please enter study notes or a topic before generating.').max(
    30_000,
    'Input is too long. Please keep notes under 30,000 characters.',
  ),
  mode: z.enum(['generate', 'refine']).default('generate'),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).default('Intermediate'),
  flashcardCount: z.coerce.number().int().min(3).max(30).default(12),
  quizCount: z.coerce.number().int().min(3).max(25).default(8),
  refinement: z.string().max(2_000).optional().default(''),
  currentPack: z.unknown().optional().nullable(),
  faultMode: faultModeSchema.optional().default('none'),
}).superRefine((value, context) => {
  if (value.mode === 'refine' && !value.refinement.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['refinement'],
      message: 'Enter a refinement instruction first.',
    });
  }
});
