import { CreateAppointmentSchema } from '@core/application/dtos/AppointmentDtos';
import { lambdaHandlerWrapper } from '@infrastructure/common/LambdaHandlerWrapper';
// Lógica para inicializar el contenedor de DI (Awilix)
import { container } from '@infrastructure/dependency-injection/container';

async function createAppointmentHandler(event: any) {
  const body = JSON.parse(event.body);
  const dto = CreateAppointmentSchema.parse(body);

  const useCase = container.resolve('createAppointmentUseCase');
  const result = await useCase.execute(dto);

  return {
    statusCode: 202, // Accepted
    body: result,
  };
}

export const handler = lambdaHandlerWrapper(createAppointmentHandler);