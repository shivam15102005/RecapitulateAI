import { ZodError } from 'zod';

export function validateBody(schema) {
  return function validateRequestBody(request, response, next) {
    const result = schema.safeParse(request.body ?? {});

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => issue.message)
        .filter(Boolean)
        .join(' ');
      return response.status(400).json({
        error: message || 'The request body did not match the expected format.',
        issues: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    response.locals.validatedBody = result.data;
    next();
  };
}

export function isValidationError(error) {
  return error instanceof ZodError;
}
