import { SnsAppointmentEventSchema } from '@core/application/dtos/AppointmentDtos';
import { ProcessAppointmentCLUseCase } from '@core/application/use-cases/ProcessAppointmentCL';
import { container } from '@infrastructure/di/container';
import { validateAndParse } from '@core/common/utils/validation';

import { lambdaHandlerWrapper } from '@infrastructure/common/LambdaHandlerWrapper';

async function processCLHandler(event: any): Promise<void> {
  console.log('Received SQS event for CL:', JSON.stringify(event, null, 2));

  const useCase = container.resolve<ProcessAppointmentCLUseCase>('processAppointmentCLUseCase');

  for (const record of event.Records) {
    const body = JSON.parse(record.body);
    const appointmentEvent = validateAndParse(SnsAppointmentEventSchema, body);
    await useCase.execute(appointmentEvent);
  }
}

export const handler = lambdaHandlerWrapper(processCLHandler);
