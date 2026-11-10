import { randomUUID } from 'node:crypto';

export function requestLogger(request, response, next) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  request.requestId = requestId;
  response.setHeader('X-Request-Id', requestId);

  response.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    console.info(
      `[HTTP] ${request.method} ${request.originalUrl} ${response.statusCode} ${durationMs}ms requestId=${requestId}`,
    );
  });

  next();
}
