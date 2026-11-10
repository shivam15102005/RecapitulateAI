import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import healthRoutes from './routes/health.routes.js';
import studyRoutes from './routes/study.routes.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { isProduction } from './config/env.js';

const app = express();
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

app.disable('x-powered-by');
app.use(requestLogger);
app.use(express.json({ limit: '1mb' }));

// API routes are served by the same Express process in development and production.
app.use('/api/health', healthRoutes);
app.use('/api/study', studyRoutes);

if (isProduction()) {
  const distDirectory = path.join(projectRoot, 'dist');

  // Vite assets are fingerprinted, so they can be cached for a long time.
  app.use(express.static(distDirectory, {
    index: false,
    maxAge: '1y',
    immutable: true,
  }));

  // Support client-side routes while keeping API and missing-asset requests as 404s.
  app.get('*', (request, response, next) => {
    if (
      request.path === '/api' ||
      request.path.startsWith('/api/') ||
      path.extname(request.path) ||
      !request.accepts('html')
    ) {
      return next();
    }

    response.setHeader('Cache-Control', 'no-cache');
    return response.sendFile(path.join(distDirectory, 'index.html'), (error) => {
      if (error) next(error);
    });
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
