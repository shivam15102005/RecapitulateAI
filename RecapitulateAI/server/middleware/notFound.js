export function notFoundHandler(request, response) {
  response.status(404).json({
    error: `Route not found: ${request.method} ${request.originalUrl}`,
  });
}
