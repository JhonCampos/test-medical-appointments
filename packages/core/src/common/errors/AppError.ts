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
		public errors?: object[],
	) {
		super(message);
	}
}