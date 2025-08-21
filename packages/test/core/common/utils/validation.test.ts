import { z, ZodError } from 'zod';
import { validateAndParse } from '@core/common/utils/validation';
import { AppError, ErrorCode, HttpStatusCode } from '@core/common/errors/AppError';

// 1. Definimos un esquema simple para usar en las pruebas
const testSchema = z.object({
  name: z.string().min(3),
  age: z.number().positive(),
});

describe('validateAndParse', () => {

  // Test Case 1: El camino feliz, cuando los datos son válidos
  it('debe devolver los datos parseados cuando la validación es exitosa', () => {
    // Arrange
    const validData = { name: 'John Doe', age: 30 };

    // Act
    const result = validateAndParse(testSchema, validData);

    // Assert
    expect(result).toEqual(validData);
  });

  // Test Case 2: Cuando los datos no cumplen con el esquema de Zod
  it('debe lanzar un AppError estandarizado cuando la validación de Zod falla', () => {
    // Arrange
    const invalidData = { name: 'Jo', age: -5 }; // Nombre muy corto y edad negativa

    // Act & Assert
    try {
      validateAndParse(testSchema, invalidData);
      // Si llegamos aquí, la prueba falló porque no se lanzó un error
      fail('La función no lanzó ningún error');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      
      const appError = error as AppError;
      expect(appError.message).toBe('La solicitud contiene datos inválidos.');
      expect(appError.errorCode).toBe(ErrorCode.BadRequest);
      expect(appError.statusCode).toBe(HttpStatusCode.BAD_REQUEST);
      
      // Verificamos que los detalles del error de Zod se adjuntaron
      expect(appError.errors).toBeDefined();
      expect(Array.isArray(appError.errors)).toBe(true);
      expect(appError.errors?.length).toBe(2); // Esperamos dos errores de validación
    }
  });

  // Test Case 3: Cuando ocurre un error que no es de Zod
  it('debe relanzar el error si no es una instancia de ZodError', () => {
    // Arrange
    const unexpectedError = new Error('Error inesperado en la base de datos');
    
    // Creamos un esquema simulado que siempre lanza un error genérico
    const mockSchemaWithError = {
      parse: () => {
        throw unexpectedError;
      },
    } as any;

    // Act & Assert
    expect(() => {
      validateAndParse(mockSchemaWithError, {});
    }).toThrow(unexpectedError);
  });
});