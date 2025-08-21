import { AppError, ErrorCode, HttpStatusCode } from '@core/common/errors/AppError';

/**
 * Genera un log de error estructurado en formato JSON.
 * @param error El objeto de error capturado.
 */
function logError(error: Error | AppError): void {
  const logPayload = {
    level: "ERROR",
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...((error instanceof AppError) && { // Agrega contexto si es un AppError
        code: error.errorCode,
        statusCode: error.statusCode,
        details: error.errors || [],
      }),
    }
  };
  console.error(JSON.stringify(logPayload, null, 2));
}

/**
 * Maneja los errores capturados en el Lambda y los convierte en una respuesta HTTP estándar.
 * También se encarga de registrar el error de forma estructurada.
 *
 * @param {unknown} error El error capturado.
 * @returns El objeto de respuesta HTTP para API Gateway.
 */
export function handleError(error: unknown) {
  if (error instanceof AppError) {
    logError(error);
    return {
      statusCode: error.statusCode,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: error.errorCode,
        message: error.message,
        ...(error.errors && { errors: error.errors }),
      }),
    };
  }

  // Captura de errores inesperados
  const unexpectedError = error instanceof Error
    ? error
    : new Error('An unexpected error occurred.');

  logError(unexpectedError);

  return {
    statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: ErrorCode.ServerError,
      message: 'Ocurrió un error inesperado.',
    }),
  };
}