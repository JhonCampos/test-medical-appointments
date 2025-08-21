import { CreateAppointmentSchema } from '@core/application/dtos/AppointmentDtos';
import { lambdaHandlerWrapper } from '@infrastructure/common/LambdaHandlerWrapper';
import { container } from '@infrastructure/di/container';
import { CreateAppointmentUseCase } from '@core/application/use-cases/CreateAppointment';
import { validateAndParse } from '@core/common/utils/validation';

async function createAppointmentHandler(event: any) {
  const body = JSON.parse(event.body);
  
  // Usamos el nuevo wrapper de validación.
  // Si la validación falla, lanzará un AppError que será capturado por el lambdaHandlerWrapper.
  const dto = validateAndParse(CreateAppointmentSchema, body);

  const useCase = container.resolve<CreateAppointmentUseCase>('createAppointmentUseCase');
  const result = await useCase.execute(dto);

  return {
    statusCode: 202, // Accepted
    body: result,
  };
}

export const handler = lambdaHandlerWrapper(createAppointmentHandler);