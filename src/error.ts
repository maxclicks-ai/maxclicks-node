import type { ErrorResponse, MAXCLICKS_ERROR_CODE_KEY } from './interfaces';

export class MaxclicksError extends Error {
  public readonly name: MAXCLICKS_ERROR_CODE_KEY;
  public readonly code: MAXCLICKS_ERROR_CODE_KEY;
  public readonly requestId?: string;
  public readonly timestamp?: string;
  public readonly details?: Record<string, any>;

  public constructor(
    message: string,
    code: MAXCLICKS_ERROR_CODE_KEY,
    requestId?: string,
    timestamp?: string,
    details?: Record<string, any>
  ) {
    super(message);
    this.code = code;
    this.name = code;
    this.requestId = requestId;
    this.timestamp = timestamp;
    this.details = details;
  }

  public static fromResponse(response: ErrorResponse) {
    return new MaxclicksError(
      response.error.message,
      response.error.code,
      response.requestId,
      response.timestamp,
      response.error.details
    );
  }

  public override toString() {
    return JSON.stringify(
      {
        message: this.message,
        code: this.code,
        ...(this.requestId && { requestId: this.requestId }),
        ...(this.timestamp && { timestamp: this.timestamp }),
        ...(this.details && { details: this.details }),
      },
      null,
      2
    );
  }
}
