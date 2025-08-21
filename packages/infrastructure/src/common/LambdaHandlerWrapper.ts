import { AppError } from '../../../core/src/common/AppError';
import { ZodError } from 'zod';

export const lambdaHandlerWrapper = (handler: Function) => async (event: any, context: any) => {
  try {
    console.log('Request Event:', JSON.stringify(event, null, 2));
    const result = await handler(event, context);

    return {
      statusCode: result.statusCode || 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.body),
    };
  } catch (error: any) {
    if (error instanceof ZodError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          code: 'VALIDATION_ERROR',
          message: 'La solicitud contiene datos inválidos.',
          errors: error.errors,
        }),
      };
    }

    if (error instanceof AppError) {
      return {
        statusCode: error.statusCode,
        body: JSON.stringify({
          code: error.errorCode,
          message: error.message,
          errors: error.errors || [],
        }),
      };
    }
    
    console.error("UNEXPECTED_ERROR", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        code: 'SERVER_ERROR',
        message: 'Ocurrió un error inesperado.',
      }),
    };
  }
};