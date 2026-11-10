import test from 'node:test';
import assert from 'node:assert/strict';
import { studyRequestSchema } from './studyRequest.schema.js';

const minimumValidRequest = {
  notes: 'Newton law of motion and examples.',
};

test('applies safe defaults to a minimal generation request', () => {
  const result = studyRequestSchema.safeParse(minimumValidRequest);

  assert.equal(result.success, true);
  assert.equal(result.data.mode, 'generate');
  assert.equal(result.data.difficulty, 'Intermediate');
  assert.equal(result.data.flashcardCount, 12);
  assert.equal(result.data.quizCount, 8);
  assert.equal(result.data.faultMode, 'none');
});

test('rejects blank notes', () => {
  const result = studyRequestSchema.safeParse({ notes: '   ' });
  assert.equal(result.success, false);
});

test('rejects a refinement request without an instruction', () => {
  const result = studyRequestSchema.safeParse({
    ...minimumValidRequest,
    mode: 'refine',
    refinement: '   ',
  });
  assert.equal(result.success, false);
});

test('rejects unsupported fault simulator modes', () => {
  const result = studyRequestSchema.safeParse({
    ...minimumValidRequest,
    faultMode: 'unknown-mode',
  });
  assert.equal(result.success, false);
});

test('rejects notes above the 30,000 character limit', () => {
  const result = studyRequestSchema.safeParse({ notes: 'x'.repeat(30_001) });
  assert.equal(result.success, false);
});
