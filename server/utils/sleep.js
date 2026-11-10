export function sleep(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    let timeoutId;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      signal?.removeEventListener('abort', onAbort);
    };

    const onAbort = () => {
      cleanup();
      const error = new Error('Request was cancelled by the client.');
      error.name = 'AbortError';
      reject(error);
    };

    if (signal?.aborted) {
      onAbort();
      return;
    }

    timeoutId = setTimeout(() => {
      cleanup();
      resolve();
    }, milliseconds);

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
