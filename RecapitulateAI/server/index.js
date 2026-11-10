import { env } from './config/env.js';
import app from './app.js';
import { getProviderPlan } from './services/ai/providerRegistry.js';

const server = app.listen(env.port, '0.0.0.0', () => {
  console.info(`RecapitulateAI API listening on http://localhost:${env.port}`);
  const providers = getProviderPlan().map((provider) => provider.name);
  console.info(
    providers.length
      ? `Configured AI providers: ${providers.join(' -> ')}`
      : 'No AI provider configured yet. Add a key to the server-side .env file.',
  );
  console.info(`Provider request timeout: ${env.providerTimeoutMs}ms`);
});

function shutdown(signal) {
  console.info(`[API] ${signal} received. Closing HTTP server...`);
  server.close((error) => {
    if (error) {
      console.error('[API] Error during shutdown:', error);
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
