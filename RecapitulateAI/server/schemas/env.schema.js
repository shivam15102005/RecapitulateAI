import { z } from 'zod';

export const serverEnvSchema = z.object({
  NODE_ENV: z.string().min(1).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  AI_PROVIDER_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(18_500).default(18_000),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().min(1).optional().default('gemini-2.5-flash'),
  GROQ_API_KEY: z.string().optional().default(''),
  GROQ_MODEL: z.string().min(1).optional().default('llama-3.3-70b-versatile'),
  OPENAI_API_KEY: z.string().optional().default(''),
  OPENAI_MODEL: z.string().min(1).optional().default('gpt-4o-mini'),
  OLLAMA_MODEL: z.string().optional().default(''),
  OLLAMA_BASE_URL: z.string().url().optional().default('http://127.0.0.1:11434'),
  ENABLE_FAULT_SIMULATOR: z.string().optional().default('false'),
}).passthrough();
