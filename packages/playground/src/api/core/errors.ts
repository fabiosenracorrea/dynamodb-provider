export class PlaygroundError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'PlaygroundError';
  }

  static badRequest(message: string, details?: unknown): PlaygroundError {
    return new PlaygroundError(message, 400, details);
  }

  static notFound(message: string): PlaygroundError {
    return new PlaygroundError(message, 404);
  }

  static forbidden(message: string): PlaygroundError {
    return new PlaygroundError(message, 403);
  }
}

export function toErrorStatus(error: unknown): number {
  return error instanceof PlaygroundError ? error.status : 500;
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  return 'Unknown error';
}
