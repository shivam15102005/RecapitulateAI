import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverEnvSchema } from '../schemas/env.schema.js';

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const projectRoot = path.resolve(currentDirectory, '../..');

dotenv.config({ path: path.join(projectRoot, '.env') });

// GEMINI_TIMEOUT_MS is accepted as a legacy alias. New projects should use
// AI_PROVIDER_TIMEOUT_MS, which applies to the complete provider fallback flow.
let providerTimeoutSetting = process.env.AI_PROVIDER_TIMEOUT_MS;
if (providerTimeoutSetting === undefined) {
  const legacyValue = Number(process.env.GEMINI_TIMEOUT_MS ?? 18_000);
  const compatibleLegacyValue = Number.isFinite(legacyValue)
    ? Math.min(Math.max(legacyValue, 1_000), 18_500)
    : 18_000;
  providerTimeoutSetting = String(compatibleLegacyValue);
}

const rawEnvironment = {
  ...process.env,
  AI_PROVIDER_TIMEOUT_MS: providerTimeoutSetting,
};

const parsedEnvironment = serverEnvSchema.safeParse(rawEnvironment);
if (!parsedEnvironment.success) {
  const details = parsedEnvironment.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid server environment configuration:\n${details}`);
}

const source = parsedEnvironment.data;

export const env = Object.freeze({
  nodeEnv: source.NODE_ENV,
  port: source.PORT,
  providerTimeoutMs: source.AI_PROVIDER_TIMEOUT_MS,
  geminiApiKey: source.GEMINI_API_KEY,
  geminiModel: source.GEMINI_MODEL,
  groqApiKey: source.GROQ_API_KEY,
  groqModel: source.GROQ_MODEL,
  openaiApiKey: source.OPENAI_API_KEY,
  openaiModel: source.OPENAI_MODEL,
  ollamaModel: source.OLLAMA_MODEL,
  ollamaBaseUrl: source.OLLAMA_BASE_URL.replace(/\/$/, ''),
  enableFaultSimulator: source.ENABLE_FAULT_SIMULATOR === 'true',
});

export function isProduction() {
  return env.nodeEnv === 'production';
}

export function isFaultSimulationEnabled() {
  return !isProduction() || env.enableFaultSimulator;
}
