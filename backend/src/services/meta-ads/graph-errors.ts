import type { MetaWritebackError } from './writeback-types';

export function parseMetaGraphError(
  data: any,
  fallbackMessage: string,
  status: number | null,
): MetaWritebackError {
  const graphError = data && typeof data === 'object' ? data.error : null;
  const message =
    graphError && typeof graphError.message === 'string'
      ? graphError.message
      : fallbackMessage;
  const code = graphError && typeof graphError.code === 'number' ? graphError.code : null;
  const fbtraceId = graphError && typeof graphError.fbtrace_id === 'string' ? graphError.fbtrace_id : null;

  return {
    message,
    status,
    code,
    fbtraceId,
    raw: data,
  };
}

export function parseMetaRequestException(error: unknown, timeoutMs: number): MetaWritebackError {
  const message =
    (error as Error)?.name === 'AbortError'
      ? `Meta API request timeout after ${timeoutMs}ms`
      : error instanceof Error
        ? error.message
        : 'Meta API request failed';

  return {
    message,
    status: null,
    code: null,
    fbtraceId: null,
    raw: error,
  };
}
