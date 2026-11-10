import { env } from '../../config/env.js';
import { generateWithGemini } from './providers/gemini.provider.js';
import { generateWithGroq } from './providers/groq.provider.js';
import { generateWithOpenAI } from './providers/openai.provider.js';
import { generateWithOllama } from './providers/ollama.provider.js';

export function getProviderPlan() {
  const providers = [];

  if (env.geminiApiKey) providers.push({ name: 'Gemini', generate: generateWithGemini });
  if (env.groqApiKey) providers.push({ name: 'Groq', generate: generateWithGroq });
  if (env.openaiApiKey) providers.push({ name: 'OpenAI', generate: generateWithOpenAI });
  if (env.ollamaModel) providers.push({ name: 'Ollama', generate: generateWithOllama });

  return providers;
}
