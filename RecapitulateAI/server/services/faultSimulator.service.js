import { isFaultSimulationEnabled } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';
import { sleep } from '../utils/sleep.js';

const VALID_FAULT_RESPONSE = {
  title: 'Evaluator fault-simulation pack',
  summary: 'Synthetic content used to verify defensive response handling.',
  flashcards: [
    { question: 'What is active recall?', answer: 'Retrieving information from memory without looking at the source.' },
    { question: 'What is spaced repetition?', answer: 'Reviewing material at increasing intervals over time.' },
    { question: 'Why use retrieval practice?', answer: 'It strengthens memory and reveals knowledge gaps.' },
  ],
  quiz: [
    { question: 'Which method requires recalling an answer from memory?', options: ['Active recall', 'Passive rereading', 'Highlighting', 'Copying notes'], correctAnswerIndex: 0, explanation: 'Active recall requires retrieval without looking at the answer.', hint: 'Think about the difference between retrieving information and reviewing it.' },
    { question: 'What does spaced repetition optimize?', options: ['Decorative notes', 'Review timing', 'Screen brightness'], correctAnswerIndex: 1, explanation: 'It schedules reviews over increasing intervals.', hint: 'Consider how the timing between study sessions affects memory.' },
  ],
  conceptChecklist: [
    { title: 'Active recall', description: 'Practice retrieving an idea from memory.', keyPoints: ['Attempt before checking', 'Use low-stakes questions'] },
    { title: 'Spaced repetition', description: 'Revisit ideas at expanding intervals.', keyPoints: ['Avoid cramming', 'Prioritize difficult material'] },
  ],
};

function buildFaultResponse(mode) {
  if (mode === 'empty') return '';

  if (mode === 'malformed') {
    return `Here is your study pack:\n\n\`\`\`json\n${JSON.stringify(VALID_FAULT_RESPONSE, null, 2).slice(0, -1)}\n,\n\`\`\`\nHope this helps!`;
  }

  if (mode === 'trailing_comma') {
    return `${JSON.stringify(VALID_FAULT_RESPONSE, null, 2).slice(0, -1)},\n}`;
  }

  if (mode === 'partial') {
    return JSON.stringify({
      ...VALID_FAULT_RESPONSE,
      flashcards: [
        ...VALID_FAULT_RESPONSE.flashcards,
        { question: 'This card has no answer.' },
        { question: 17, answer: 'Invalid question type.' },
      ],
      quiz: [
        ...VALID_FAULT_RESPONSE.quiz,
        { question: 'Broken question with an out-of-range key.', options: ['A', 'B'], correctAnswerIndex: 4, explanation: 'This item should be dropped.' },
      ],
      conceptChecklist: [
        ...VALID_FAULT_RESPONSE.conceptChecklist,
        { title: 'Concept with malformed key points', description: 'This item should be discarded.', keyPoints: 'not-an-array' },
      ],
    });
  }

  if (mode === 'invalid_types') {
    return JSON.stringify({
      title: 'Invalid output',
      flashcards: null,
      quiz: [{ question: 4 }],
      conceptChecklist: 'none',
    });
  }

  return JSON.stringify(VALID_FAULT_RESPONSE);
}

export async function runFaultSimulation(mode, { signal } = {}) {
  if (!isFaultSimulationEnabled()) {
    throw new HttpError(403, 'The evaluator fault simulator is disabled in production.');
  }

  if (mode === 'server_error') {
    throw new HttpError(500, 'Simulated provider failure (fault simulator).');
  }

  if (mode === 'slow') await sleep(8_000, signal);
  return {
    rawText: buildFaultResponse(mode),
    provider: `Fault simulator: ${mode}`,
  };
}
