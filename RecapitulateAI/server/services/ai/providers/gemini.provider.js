import { env } from '../../../config/env.js';
import { readJsonResponse } from './httpResponse.js';

export async function generateWithGemini({ systemPrompt, userPrompt, signal }) {
  const model = env.geminiModel;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.35,
      },
    }),
  });

  const body = await readJsonResponse(response, 'Gemini');
  const text = body?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('') || '';

  if (!text.trim()) throw new Error('Gemini returned no candidate text.');
  return text;
}
