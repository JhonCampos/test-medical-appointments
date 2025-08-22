import { container } from '@infrastructure/di/container';
import { lambdaHandlerWrapper } from '@infrastructure/common/LambdaHandlerWrapper';
import { validateAndParse } from '@core/common/utils/validation';

import { CreateAppointmentUseCase } from '@core/application/use-cases/CreateAppointment';
import { ListAppointmentsUseCase } from '@core/application/use-cases/ListAppointments';
import { UpdateAppointmentStatusUseCase } from '@core/application/use-cases/UpdateAppointmentStatus';

import { CreateAppointmentSchema, ListAppointmentsRequestSchema, UpdateAppointmentStatusEventSchema } from '@core/application/dtos/AppointmentDtos';

/**
 * @description Punto de entrada principal para la API de Citas.
 * Enruta el evento entrante (API Gateway o SQS) al caso de uso apropiado.
 * @param event El evento de AWS (API Gateway Proxy o SQS).
 */
async function appointmentRouter(event: any) {
  // ----- Ruta 1: Evento de API Gateway -----
  if (event.requestContext && event.requestContext.http) {
    const httpMethod = event.requestContext.http.method;

    // ----- Sub-Ruta 1.1: Crear Cita (POST /appointments) -----
    if (httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      const dto = validateAndParse(CreateAppointmentSchema, body);

      const useCase = container.resolve<CreateAppointmentUseCase>('createAppointmentUseCase');
      const result = await useCase.execute(dto);

      return {
        statusCode: 202, // Accepted
        body: result,
      };
    }

    // ----- Sub-Ruta 1.2: Listar Citas (GET /appointments/{insuredId}) -----
    if (httpMethod === 'GET') {
      const { insuredId } = validateAndParse(ListAppointmentsRequestSchema, event.pathParameters);
      
      const useCase = container.resolve<ListAppointmentsUseCase>('listAppointmentsUseCase');
      const result = await useCase.execute(insuredId);

      return {
        statusCode: 200,
        body: result,
      };
    }
  }

  // ----- Ruta 2: Evento de SQS (Actualización de Estado) -----
  if (event.Records && event.Records[0].eventSource === 'aws:sqs') {
    console.log('Received SQS event for status update:', JSON.stringify(event, null, 2));
    const useCase = container.resolve<UpdateAppointmentStatusUseCase>('updateAppointmentStatusUseCase');

    for (const record of event.Records) {
      try {
        const body = JSON.parse(record.body);
        const eventDetail = body.detail;
        
        const validatedEvent = validateAndParse(UpdateAppointmentStatusEventSchema, eventDetail);

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
    // Para invocaciones de SQS exitosas, no se necesita retornar un body.
    // El wrapper se encargará de la respuesta si no hay errores.
    return;
  }
  
  // Si el evento no coincide con ninguna ruta, es un error.
  console.error('Evento no reconocido o no soportado:', JSON.stringify(event, null, 2));
  throw new Error('Tipo de evento no soportado por este handler.');
}

// Envolvemos nuestro enrutador con el manejador de errores y respuestas estándar.
// Nota: El lambdaHandlerWrapper está diseñado para respuestas HTTP.
// Para SQS, si hay un error, lo propagará correctamente. Si no hay error,
// el wrapper no afectará la ejecución.
export const handler = lambdaHandlerWrapper(appointmentRouter);