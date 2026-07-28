export type ApiErrorPayload = {
  message?: string;
  errors?: unknown;
};
export async function readApiResponse<T extends ApiErrorPayload>(
  response: Response,
): Promise<T> {
  const responseText = await response.text();
  if (!responseText.trim()) {
    return {
      message: response.ok
        ? "The server returned an empty response."
        : `The request failed with HTTP ${response.status}.`,
    } as T;
  }
  try {
    return JSON.parse(responseText) as T;
  } catch {
    return {
      message: `The server returned an invalid response (HTTP ${response.status}).`,
    } as T;
  }
}
