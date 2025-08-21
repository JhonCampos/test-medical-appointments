import { handleError } from './ErrorHandler';

/**
 * Wrapper de alto nivel para los manejadores de Lambda.
 * Se encarga de la ejecución, el manejo de respuestas exitosas y la delegación
 * de errores al manejador centralizado.
 *
 * @param handler La función del manejador de Lambda a ejecutar.
 */
export const lambdaHandlerWrapper = (handler: Function) => async (event: any, context: any) => {
  try {
    console.log('Request Event:', JSON.stringify(event, null, 2));
    const result = await handler(event, context);

    return {
      statusCode: result.statusCode || 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.body),
    };
  } catch (error: unknown) {
    // Toda la lógica de manejo de errores se delega a nuestro nuevo manejador.
    return handleError(error);
  }
};