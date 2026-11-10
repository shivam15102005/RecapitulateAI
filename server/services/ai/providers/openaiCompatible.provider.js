import { readJsonResponse } from './httpResponse.js';

export async function generateWithChatCompletions({
  providerName,
  baseUrl,
  apiKey,
  model,
  systemPrompt,
  userPrompt,
  signal,
}) {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  const body = await readJsonResponse(response, providerName);
  const text = body?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error(`${providerName} returned empty content.`);
  }
  return text;
}
