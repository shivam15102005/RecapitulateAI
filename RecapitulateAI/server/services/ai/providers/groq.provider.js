import { env } from '../../../config/env.js';
import { generateWithChatCompletions } from './openaiCompatible.provider.js';

export function generateWithGroq(args) {
  return generateWithChatCompletions({
    ...args,
    providerName: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKey: env.groqApiKey,
    model: env.groqModel,
  });
}
