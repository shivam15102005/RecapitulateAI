import { env } from '../../../config/env.js';
import { readJsonResponse } from './httpResponse.js';

export async function generateWithOllama({ systemPrompt, userPrompt, signal }) {
  const response = await fetch(`${env.ollamaBaseUrl}/api/generate`, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: env.ollamaModel,
      system: systemPrompt,
      prompt: userPrompt,
      stream: false,
      format: 'json',
      options: { temperature: 0.35 },
    }),
  });

  const body = await readJsonResponse(response, 'Ollama');
  if (typeof body?.response !== 'string' || !body.response.trim()) {
    throw new Error('Ollama returned empty content.');
  }
  return body.response;
}
