// (Reutilizar el código de AppError y sus subclases del proyecto anterior)
export enum ErrorCode {
  BadRequest = "BAD_REQUEST",
  NotFound = "NOT_FOUND",
  ServerError = "SERVER_ERROR",
}

export enum HttpStatusCode {
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

export class AppError extends Error {
  constructor(
    message: string,
    public errorCode: ErrorCode,
    public statusCode: HttpStatusCode,
    public errors?: object[]
  ) {
    super(message);
  }
}

export class BadRequestError extends AppError {
  constructor(errors?: object[], message?: string) {
    super(
      message ?? "La solicitud contiene datos inválidos.",
      ErrorCode.BadRequest,
      HttpStatusCode.BAD_REQUEST,
      errors
    );
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Recurso no encontrado") {
    super(message, ErrorCode.NotFound, HttpStatusCode.NOT_FOUND);
  }
}
