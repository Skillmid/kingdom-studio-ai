export class ProviderTimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(
      `The generation provider did not respond within ${Math.round(timeoutMs / 1000)}s. ` +
        "The provider may still have accepted the task; check the provider dashboard before retrying.",
    );
    this.name = "ProviderTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

export function isTimeoutError(error: unknown): boolean {
  if (error instanceof ProviderTimeoutError) return true;
  if (!(error instanceof Error)) return false;
  return error.name === "TimeoutError" || error.name === "AbortError";
}

/**
 * Wraps a fetch implementation so every request is aborted after `timeoutMs`.
 * An existing caller signal is still honoured.
 */
export function createTimeoutFetch(fetchImpl: typeof fetch, timeoutMs: number): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new ProviderTimeoutError(timeoutMs)), timeoutMs);
    const callerSignal = init?.signal;
    const onCallerAbort = () => controller.abort(callerSignal?.reason);
    if (callerSignal) {
      if (callerSignal.aborted) controller.abort(callerSignal.reason);
      else callerSignal.addEventListener("abort", onCallerAbort, { once: true });
    }
    try {
      return await fetchImpl(input, { ...init, signal: controller.signal });
    } catch (error) {
      if (controller.signal.aborted && controller.signal.reason instanceof ProviderTimeoutError) {
        throw controller.signal.reason;
      }
      throw error;
    } finally {
      clearTimeout(timer);
      callerSignal?.removeEventListener("abort", onCallerAbort);
    }
  }) as typeof fetch;
}

/** Rejects with ProviderTimeoutError if `promise` does not settle within `timeoutMs`. */
export async function withDeadline<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new ProviderTimeoutError(timeoutMs)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Network error codes that mean the TCP connection was never established, so the request body was
 * never sent and the provider cannot have accepted (or billed) the task.
 */
const CONNECTION_NEVER_ESTABLISHED_CODES = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ENETUNREACH",
  "EHOSTUNREACH",
  "UND_ERR_CONNECT_TIMEOUT",
]);

function errorCode(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const code = (value as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

/**
 * True only when a fetch error proves the request never left this server (DNS failure, connection
 * refused, unreachable host, connect timeout). Timeouts, aborts, resets and every unrecognised error
 * return false: the request may have been sent, so the provider state must be treated as unknown.
 */
export function isRequestDefinitelyNotSent(error: unknown): boolean {
  if (isTimeoutError(error)) return false;
  const code = errorCode(error) ?? errorCode(error instanceof Error ? error.cause : undefined);
  return code !== undefined && CONNECTION_NEVER_ESTABLISHED_CODES.has(code);
}
