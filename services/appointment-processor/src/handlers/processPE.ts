import { SnsAppointmentEventSchema } from '@core/application/dtos/AppointmentDtos';
import { ProcessAppointmentPEUseCase } from '@core/application/use-cases/ProcessAppointmentPE';
import { container } from '@infrastructure/di/container';
import { validateAndParse } from '@core/common/utils/validation';
import { lambdaHandlerWrapper } from '@infrastructure/common/LambdaHandlerWrapper';

async function processPEHandler(event: any): Promise<void> {
  console.log('Received SQS event for PE:', JSON.stringify(event, null, 2));

  const useCase = container.resolve<ProcessAppointmentPEUseCase>('processAppointmentPEUseCase');

  for (const record of event.Records) {
    const body = JSON.parse(record.body);
    const appointmentEvent = validateAndParse(SnsAppointmentEventSchema, body);
    await useCase.execute(appointmentEvent);
  }
}

export const handler = lambdaHandlerWrapper(processPEHandler);

