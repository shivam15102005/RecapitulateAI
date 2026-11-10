import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSystemPrompt, buildUserPrompt } from './prompts.js';

test('study-generation prompt requires a hint for every flashcard and quiz question', () => {
  const prompt = buildSystemPrompt();

  assert.match(prompt, /Every flashcard must have a non-empty question, answer, and hint/);
  assert.match(prompt, /Every quiz item must have .* non-empty hint/);
  assert.match(prompt, /Never omit a hint from any flashcard or quiz question/);
});

test('study-generation prompt tells the model not to reveal answers in hints', () => {
  const prompt = buildSystemPrompt();

  assert.match(prompt, /without stating or paraphrasing it/);
  assert.match(prompt, /must not name the correct option, state the answer/);
});

test('user prompt continues to include requested flashcard and quiz counts', () => {
  const prompt = buildUserPrompt({
    notes: 'Sample study material',
    difficulty: 'Intermediate',
    flashcardCount: 5,
    quizCount: 7,
    mode: 'generate',
  });

  assert.match(prompt, /Requested flashcards: 5/);
  assert.match(prompt, /Requested quiz questions: 7/);
});

test('study-generation prompt requests plain-text Unicode math instead of raw LaTeX delimiters', () => {
  const prompt = buildSystemPrompt();

  assert.match(prompt, /Mathematical notation must be readable as plain text/);
  assert.match(prompt, /Do not use LaTeX commands or math delimiters/);
  assert.match(prompt, /Nₛ = 120f \/ P/);
});
