import { UpdateAppointmentStatusEventSchema } from '@core/application/dtos/AppointmentDtos';
import { UpdateAppointmentStatusUseCase } from '@core/application/use-cases/UpdateAppointmentStatus';
import { container } from '@infrastructure/di/container';
import { validateAndParse } from '@core/common/utils/validation'; // [!code ++]

export const handler = async (event: any): Promise<void> => {
  console.log('Received SQS event for status update:', JSON.stringify(event, null, 2));
  const useCase = container.resolve<UpdateAppointmentStatusUseCase>('updateAppointmentStatusUseCase');

  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);
      // El cuerpo del mensaje de SQS contiene el evento completo de EventBridge.
      // El payload que nos interesa está en la propiedad 'detail'.
      const eventDetail = body.detail;
      
      // 1. Validar el detalle del evento usando nuestra función estandarizada
      const validatedEvent = validateAndParse(UpdateAppointmentStatusEventSchema, eventDetail); // [!code ++]
      // const validatedEvent = UpdateAppointmentStatusEventSchema.parse(eventDetail); // [!code --]

      // 2. Ejecutar el caso de uso con los datos validados
      await useCase.execute({
        appointmentId: validatedEvent.appointmentId,
        insuredId: validatedEvent.insuredId,
      });
    } catch (error) {
      console.error('Failed to process status update record:', record.body, error);
      // Lanzar el error para que SQS pueda gestionar los reintentos
      throw error;
    }
  }
};