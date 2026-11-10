import { generateStudyContent } from '../services/study.service.js';
import { runFaultSimulation } from '../services/faultSimulator.service.js';

export async function createStudyPack(_request, response) {
  const input = response.locals.validatedBody;
  const requestAbortController = new AbortController();

  response.once('close', () => {
    if (!response.writableEnded) requestAbortController.abort();
  });

  if (input.faultMode !== 'none') {
    const simulation = await runFaultSimulation(input.faultMode, {
      signal: requestAbortController.signal,
    });
    if (requestAbortController.signal.aborted || response.destroyed) return;
    return response.json(simulation);
  }

  const result = await generateStudyContent(input, {
    signal: requestAbortController.signal,
  });
  if (requestAbortController.signal.aborted || response.destroyed) return;
  if (!result.ok) {
    return response.status(result.statusCode).json({
      error: result.error,
      ...(result.diagnostic ? { diagnostic: result.diagnostic } : {}),
    });
  }

  return response.json(result.data);
}
