import { container } from '@infrastructure/di/container';
import { lambdaHandlerWrapper } from '@infrastructure/common/LambdaHandlerWrapper';
import { validateAndParse } from '@core/common/utils/validation';
import { AppError, ErrorCode, HttpStatusCode } from '@core/common/errors/AppError';
import type { CreateAppointmentUseCase } from '@core/application/use-cases/CreateAppointment';
import type { ListAppointmentsUseCase } from '@core/application/use-cases/ListAppointments';
import type { UpdateAppointmentStatusUseCase } from '@core/application/use-cases/UpdateAppointmentStatus';
import type { GetAppointmentUseCase } from '@core/application/use-cases/GetAppointment';

import { 
  CreateAppointmentSchema, 
  ListAppointmentsRequestSchema, 
  UpdateAppointmentStatusEventSchema,
  GetAppointmentRequestSchema 
} from '@core/application/dtos/AppointmentDtos';

// --- Controladores de Endpoints HTTP ---

/**
 * Maneja la creación de una nueva cita.
 * Corresponde a: POST /appointments
 */
async function createAppointmentHandler(event: any) {
  const body = JSON.parse(event.body);
  const dto = validateAndParse(CreateAppointmentSchema, body);
  const useCase = container.resolve<CreateAppointmentUseCase>('createAppointmentUseCase');
  const result = await useCase.execute(dto);
  return { statusCode: 202, body: result };
}

/**
 * Maneja la obtención de una cita específica por su ID.
 * Corresponde a: GET /appointments/{insuredId}/{appointmentId}
 */
async function getAppointmentHandler(event: any) {
  const dto = validateAndParse(GetAppointmentRequestSchema, event.pathParameters || {});
  const useCase = container.resolve<GetAppointmentUseCase>('getAppointmentUseCase');
  const result = await useCase.execute(dto);
  return { statusCode: 200, body: result };
}

/**
 * Maneja el listado de todas las citas de un asegurado.
 * Corresponde a: GET /appointments/{insuredId}
 */
async function listAppointmentsHandler(event: any) {
  const { insuredId } = validateAndParse(ListAppointmentsRequestSchema, event.pathParameters || {});
  const useCase = container.resolve<ListAppointmentsUseCase>('listAppointmentsUseCase');
  const result = await useCase.execute(insuredId);
  return { statusCode: 200, body: result };
}

// --- Routers por Origen de Evento ---

/**
 * Enruta las peticiones HTTP al controlador adecuado basado en el método y los parámetros.
 */
async function handleHttpRequest(event: any) {
  const method = event.requestContext.http.method;
  const pathParameters = event.pathParameters || {};

  if (method === 'POST') {
    return createAppointmentHandler(event);
  }

  if (method === 'GET') {
    // La ruta más específica (con appointmentId) se comprueba primero.
    if (pathParameters.appointmentId) {
      return getAppointmentHandler(event);
    }
    // La ruta general para listar.
    if (pathParameters.insuredId) {
      return listAppointmentsHandler(event);
    }
  }

  throw new AppError(`Ruta no encontrada: ${method} ${event.rawPath}`, ErrorCode.NotFound, HttpStatusCode.NOT_FOUND);
}

/**
 * Procesa los mensajes provenientes de la cola SQS para actualizar el estado de las citas.
 */
async function handleSqsRequest(event: any) {
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
}

// --- Handler Principal (Punto de Entrada) ---

/**
 * @description Punto de entrada principal para la Lambda.
 * Delega el evento al router correspondiente según su origen (API Gateway o SQS).
 */
async function mainHandler(event: any) {
  if (event.requestContext?.http) {
    return handleHttpRequest(event);
  }

  if (event.Records && Array.isArray(event.Records)) {
    await handleSqsRequest(event);
    return; // Los manejadores de SQS no devuelven una respuesta HTTP.
  }
  
  throw new AppError('Tipo de evento no soportado', ErrorCode.BadRequest, HttpStatusCode.BAD_REQUEST);
}

export const handler = lambdaHandlerWrapper(mainHandler);