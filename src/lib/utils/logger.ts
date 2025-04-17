type LogLevel = "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

interface ErrorWithCause {
  cause?: unknown;
}

/**
 * Formats error details including the stack trace and cause chain
 */
function formatError(error: Error & ErrorWithCause): string {
  const details = [`Error: ${error.message}`, `Stack: ${error.stack || "No stack trace"}`];

  let currentCause = error.cause;
  while (currentCause) {
    if (currentCause instanceof Error) {
      details.push(`Caused by: ${currentCause.message}`, `Stack: ${currentCause.stack || "No stack trace"}`);
      currentCause = (currentCause as ErrorWithCause).cause;
    } else {
      details.push(`Caused by: ${String(currentCause)}`);
      break;
    }
  }

  return details.join("\n");
}

/**
 * Logs a message with optional context and error details
 */
export function log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `\nContext: ${JSON.stringify(context, null, 2)}` : "";
  const errorStr = error ? `\n${formatError(error)}` : "";

  const fullMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}${errorStr}`;

  switch (level) {
    case "info":
      // eslint-disable-next-line no-console
      console.log(fullMessage);
      break;
    case "warn":
      // eslint-disable-next-line no-console
      console.warn(fullMessage);
      break;
    case "error":
      // eslint-disable-next-line no-console
      console.error(fullMessage);
      break;
  }
}
