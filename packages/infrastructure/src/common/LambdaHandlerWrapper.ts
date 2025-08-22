import { handleError } from './ErrorHandler';

/**
 * Wrapper simple para los manejadores de Lambda.
 * Maneja tanto eventos HTTP (API Gateway) como eventos SQS de forma transparente.
 */
export const lambdaHandlerWrapper = (handler: Function) => async (event: any, context: any) => {
  try {
    console.log('Request Event:', JSON.stringify(event, null, 2));
    const result = await handler(event, context);

    // Si el handler no retorna nada (típico en SQS), simplemente retornamos undefined
    if (result === undefined || result === null) {
      return;
    }

    // Si ya es una respuesta HTTP formateada, la retornamos tal como está
    if (typeof result === 'object' && result.statusCode && 'body' in result) {
      return result;
    }

    // Si es para API Gateway (tiene requestContext), formateamos como respuesta HTTP
    if (event.requestContext) {
      return {
        statusCode: result.statusCode || 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.body !== undefined ? result.body : result),
      };
    }

    // Para cualquier otro caso, retornamos el resultado tal como está
    return result;
    
  } catch (error: unknown) {
    // Si es un evento SQS, re-lanzamos el error para que SQS maneje los reintentos
    if (event.Records && Array.isArray(event.Records)) {
      console.error('SQS Handler Error:', error);
      throw error;
    }
    
    // Para eventos HTTP, usamos nuestro manejador de errores
    return handleError(error);
  }
};