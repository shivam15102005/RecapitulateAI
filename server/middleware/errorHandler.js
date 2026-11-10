import { HttpError } from '../utils/httpError.js';

export function errorHandler(error, request, response, _next) {
  if (response.headersSent || response.destroyed) return;

  if (error?.type === 'entity.parse.failed') {
    return response.status(400).json({ error: 'The request body was not valid JSON.' });
  }

  if (error?.type === 'entity.too.large') {
    return response.status(413).json({ error: 'The request body is too large.' });
  }

  if (error instanceof HttpError) {
    return response.status(error.statusCode).json({
      error: error.message,
      ...(error.details ? { diagnostic: error.details } : {}),
    });
  }

  console.error(`[API error] requestId=${request.requestId || 'unknown'}`, error);
  return response.status(500).json({
    error: 'Unexpected server error. Check the API server console for details.',
  });
}
