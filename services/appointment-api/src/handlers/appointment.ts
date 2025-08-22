import { container } from '@infrastructure/di/container';
import { lambdaHandlerWrapper } from '@infrastructure/common/LambdaHandlerWrapper';
import { validateAndParse } from '@core/common/utils/validation';

// Importamos solo los tipos que necesitamos
import type { CreateAppointmentUseCase } from '@core/application/use-cases/CreateAppointment';
import type { ListAppointmentsUseCase } from '@core/application/use-cases/ListAppointments';
import type { UpdateAppointmentStatusUseCase } from '@core/application/use-cases/UpdateAppointmentStatus';

import { 
  CreateAppointmentSchema, 
  ListAppointmentsRequestSchema, 
  UpdateAppointmentStatusEventSchema 
} from '@core/application/dtos/AppointmentDtos';

/**
 * @description Punto de entrada principal para la API de Citas.
 * Maneja tanto eventos HTTP (API Gateway) como eventos SQS de forma simple.
 */
async function appointmentRouter(event: any) {
  // ----- Ruta 1: Eventos HTTP (API Gateway) -----
  if (event.requestContext?.http) {
    const httpMethod = event.requestContext.http.method;

    if (httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      const dto = validateAndParse(CreateAppointmentSchema, body);

      const useCase = container.resolve<CreateAppointmentUseCase>('createAppointmentUseCase');
      const result = await useCase.execute(dto);

      return {
        statusCode: 202,
        body: result,
      };
    }

    if (httpMethod === 'GET') {
      const { insuredId } = validateAndParse(ListAppointmentsRequestSchema, event.pathParameters || {});
      
      const useCase = container.resolve<ListAppointmentsUseCase>('listAppointmentsUseCase');
      const result = await useCase.execute(insuredId);

      return {
        statusCode: 200,
        body: result,
      };
    }

    throw new Error(`Método HTTP no soportado: ${httpMethod}`);
  }

  // ----- Ruta 2: Eventos SQS -----
  if (event.Records && Array.isArray(event.Records)) {
    console.log('Processing SQS event for status update');
    const useCase = container.resolve<UpdateAppointmentStatusUseCase>('updateAppointmentStatusUseCase');

    for (const record of event.Records) {
      const body = JSON.parse(record.body);
      const eventDetail = body.detail;
      
      const validatedEvent = validateAndParse(UpdateAppointmentStatusEventSchema, eventDetail);

      await useCase.execute({
        appointmentId: validatedEvent.appointmentId,
        insuredId: validatedEvent.insuredId,
      });
    }

    // Para SQS, no necesitamos retornar nada
    return;
  }
  
  throw new Error('Tipo de evento no soportado');
}

export const handler = lambdaHandlerWrapper(appointmentRouter);