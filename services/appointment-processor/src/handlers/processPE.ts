import { SnsAppointmentEventSchema } from '@core/application/dtos/AppointmentDtos';
import { ProcessAppointmentPEUseCase } from '@core/application/use-cases/ProcessAppointmentPE';
import { container } from '@infrastructure/di/container';
import { validateAndParse } from '@core/common/utils/validation';

export const handler = async (event: any): Promise<void> => {
  console.log('Received SQS event for PE:', JSON.stringify(event, null, 2));
  const useCase = container.resolve<ProcessAppointmentPEUseCase>('processAppointmentPEUseCase');

  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);
      const appointmentEvent = validateAndParse(SnsAppointmentEventSchema, body);
      await useCase.execute(appointmentEvent);
    } catch (error) {
      console.error('Failed to process PE record:', record.body, error);
      throw error;
    }
  }
};