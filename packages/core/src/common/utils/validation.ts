import { z, ZodError } from 'zod/v4';
import { BadRequestError } from '../errors/AppError';

/**
 * Valida y parsea un objeto de datos usando un esquema de Zod v4.
 * Si la validación falla, lanza un AppError estandarizado con los detalles.
 *
 * @template T El tipo inferido del esquema.
 * @param {z.ZodSchema<T>} schema El esquema de Zod para la validación.
 * @param {unknown} data Los datos a validar.
 * @returns {T} Los datos validados y tipados.
 * @throws {AppError} Si la validación falla.
 */
export function validateAndParse<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      // Lanza nuestro error personalizado adjuntando los detalles de Zod.
      throw new BadRequestError(error.issues);
    }
    // Si es otro tipo de error, lo relanzamos.
    throw error;
  }
}