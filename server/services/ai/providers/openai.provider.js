import { env } from '../../../config/env.js';
import { generateWithChatCompletions } from './openaiCompatible.provider.js';

export function generateWithOpenAI(args) {
  return generateWithChatCompletions({
    ...args,
    providerName: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: env.openaiApiKey,
    model: env.openaiModel,
  });
}
