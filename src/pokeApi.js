export async function fetchJsonWithTimeout(url, label, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`${label} failed`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`${label} timed out`);
    }

    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}
