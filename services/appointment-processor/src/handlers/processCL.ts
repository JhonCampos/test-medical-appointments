import { SnsAppointmentEventSchema } from '@core/application/dtos/AppointmentDtos';
import { ProcessAppointmentCLUseCase } from '@core/application/use-cases/ProcessAppointmentCL';
import { container } from '@infrastructure/di/container';
import { validateAndParse } from '@core/common/utils/validation';

export const handler = async (event: any): Promise<void> => {
  console.log('Received SQS event for CL:', JSON.stringify(event, null, 2));
  const useCase = container.resolve<ProcessAppointmentCLUseCase>('processAppointmentCLUseCase');

  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);
      const appointmentEvent = validateAndParse(SnsAppointmentEventSchema, body);
      await useCase.execute(appointmentEvent);
    } catch (error) {
      console.error('Failed to process CL record:', record.body, error);
      throw error;
    }
  }
};