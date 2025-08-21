import { SnsAppointmentEventSchema } from '@core/application/dtos/AppointmentDtos';
import { ProcessAppointmentUseCase } from '@core/application/use-cases/ProcessAppointment';
import { container } from '@infrastructure/di/container';

export const handler = async (event: any): Promise<void> => {
  console.log('Received SQS event:', JSON.stringify(event, null, 2));

  // Resolver el caso de uso desde el contenedor de DI centralizado
  const useCase = container.resolve<ProcessAppointmentUseCase>('processAppointmentUseCase');

  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);
      
      // 1. Validar el payload del evento
      const appointmentEvent = SnsAppointmentEventSchema.parse(body);

      // 2. Ejecutar el caso de uso
      await useCase.execute(appointmentEvent);

    } catch (error) {
      console.error('Failed to process record:', record.body, error);
      throw error; 
    }
  }
};