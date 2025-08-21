import { ListAppointmentsRequestSchema } from '@core/application/dtos/AppointmentDtos';
import { lambdaHandlerWrapper } from '@infrastructure/common/LambdaHandlerWrapper';
import { container } from '@infrastructure/di/container';
import { ListAppointmentsUseCase } from '@core/application/use-cases/ListAppointments';

/**
 * @description Manejador de Lambda para listar citas por insuredId.
 */
async function listAppointmentsHandler(event: any) {
  // Extraer parámetros de la ruta y validarlos
  const { insuredId } = ListAppointmentsRequestSchema.parse(event.pathParameters);

  // Resolver la dependencia del caso de uso
  const useCase = container.resolve<ListAppointmentsUseCase>('listAppointmentsUseCase');
  
  // Ejecutar el caso de uso
  const result = await useCase.execute(insuredId);

  // Retornar la respuesta exitosa
  return {
    statusCode: 200,
    body: result,
  };
}

export const handler = lambdaHandlerWrapper(listAppointmentsHandler);