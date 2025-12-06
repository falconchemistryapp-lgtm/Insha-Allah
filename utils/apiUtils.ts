const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 500; // Reduced from 2000ms to 500ms for faster retries

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * A wrapper for Gemini API calls that implements an exponential backoff retry mechanism
 * for common transient errors like rate limiting (429) and server errors (5xx).
 * @param apiCall The function that makes the actual API call.
 * @returns The result of the API call.
 * @throws Throws an error if the API call fails after all retries or for a non-retriable error.
 */
export async function makeApiCall<T>(apiCall: () => Promise<T>): Promise<T> {
  let lastError: any;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await apiCall();
    } catch (error: any) {
      lastError = error;
      const errorString = error.toString();
      // Retry on rate limiting (429) and common server-side errors (5xx).
      if (errorString.includes('429') || errorString.includes('500') || errorString.includes('503') || errorString.includes('504')) {
          const delayTime = INITIAL_DELAY_MS * Math.pow(2, i) + Math.random() * 500; // Reduced jitter
          console.warn(`Retriable API error encountered: ${errorString}. Retrying in ${Math.round(delayTime / 1000)}s... (Attempt ${i + 1}/${MAX_RETRIES})`);
          await delay(delayTime);
      } else {
        // For other errors (e.g., 400 Bad Request), fail immediately.
        throw error;
      }
    }
  }
  // If all retries fail, throw the last captured error.
  console.error("API call failed after multiple retries.", lastError);
  throw lastError;
}