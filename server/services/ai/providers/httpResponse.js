export async function readJsonResponse(response, providerName) {
  const responseText = await response.text();
  let body;

  try {
    body = JSON.parse(responseText);
  } catch {
    throw new Error(`${providerName} returned a non-JSON HTTP response (${response.status}).`);
  }

  if (!response.ok) {
    const message = body?.error?.message || body?.message || `HTTP ${response.status}`;
    throw new Error(`${providerName}: ${message}`);
  }

  return body;
}
