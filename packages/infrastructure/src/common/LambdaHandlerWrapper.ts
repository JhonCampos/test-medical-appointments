// packages/infrastructure/src/common/LambdaHandlerWrapper.ts

import { handleError } from './ErrorHandler';

/**
 * Wrapper para los manejadores de Lambda que abstrae el manejo de respuestas y errores.
 * Detecta si el evento proviene de API Gateway (HTTP) o SQS y formatea la
 * respuesta o maneja el error de la manera adecuada para cada servicio.
 */
export const lambdaHandlerWrapper = (handler: Function) => async (event: any, context: any) => {
  try {
    console.log('Request Event:', JSON.stringify(event, null, 2));
    const result = await handler(event, context);

    // Si el handler no retorna nada (típico en SQS), simplemente terminamos.
    if (result === undefined || result === null) {
      return;
    }

    // Si el resultado ya es una respuesta HTTP formateada, nos aseguramos
    // de que el body sea un string JSON antes de devolverlo.
    if (typeof result === 'object' && 'statusCode' in result && 'body' in result) {
      return {
        ...result,
        headers: {
          "Content-Type": "application/json",
          ...result.headers,
        },
        body: typeof result.body === 'string' ? result.body : JSON.stringify(result.body),
      };
    }

    // Si es un evento de API Gateway pero el handler solo devolvió el objeto del body,
    // lo envolvemos en una respuesta HTTP 200 estándar.
    if (event.requestContext) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      };
    }

    // Para cualquier otro tipo de invocación (ej. directa), retornamos el resultado tal cual.
    return result;
  } catch (error: unknown) {
    // Si el evento es de SQS, relanzamos el error para que SQS gestione los reintentos
    // y eventualmente lo mueva a la DLQ.
    if (event.Records && Array.isArray(event.Records)) {
      console.error('SQS Handler Error:', error);
      throw error;
    }
    
    // Para eventos HTTP, usamos nuestro manejador centralizado para devolver
    // una respuesta de error HTTP consistente.
    return handleError(error);
  }
};