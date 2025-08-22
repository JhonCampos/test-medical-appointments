/**
 * @fileoverview Configuración del contenedor de inyección de dependencias (DI) para la aplicación.
 *
 * Este archivo utiliza la librería 'awilix' para registrar todas las implementaciones
 * concretas (adaptadores) de las interfaces definidas en el dominio (puertos).
 * Esto permite desacoplar la lógica de negocio de la infraestructura, facilitando
 * las pruebas y la mantenibilidad.
 */

import { createContainer, asClass, InjectionMode } from 'awilix';
import { CreateAppointmentUseCase } from '@core/application/use-cases/CreateAppointment';
import { ListAppointmentsUseCase } from '@core/application/use-cases/ListAppointments';
import { UpdateAppointmentStatusUseCase } from '@core/application/use-cases/UpdateAppointmentStatus';
import { GetAppointmentUseCase } from '@core/application/use-cases/GetAppointment'; // [!code ++]
// Importamos los nuevos casos de uso
import { ProcessAppointmentPEUseCase } from '@core/application/use-cases/ProcessAppointmentPE';
import { ProcessAppointmentCLUseCase } from '@core/application/use-cases/ProcessAppointmentCL';

// Se utilizan alias de ruta para consistencia
import { DynamoDbAppointmentRepository } from '@infrastructure/persistence/dynamodb/AppointmentRepository';
import { SnsEventPublisher } from '@infrastructure/messaging/SnsEventPublisher';
import { AppointmentRdsRepository } from '@infrastructure/persistence/rds/AppointmentRdsRepository';
import { EventBridgePublisher } from '@infrastructure/messaging/EventBridgePublisher';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  // Repositorios
  appointmentRepository: asClass(DynamoDbAppointmentRepository).singleton(),
  countryRepository: asClass(AppointmentRdsRepository).singleton(),
  
  // Publicadores de Eventos
  eventPublisher: asClass(SnsEventPublisher).singleton(),
  confirmationPublisher: asClass(EventBridgePublisher).singleton(),

  // Casos de Uso
  createAppointmentUseCase: asClass(CreateAppointmentUseCase).singleton(),
  listAppointmentsUseCase: asClass(ListAppointmentsUseCase).singleton(),
  getAppointmentUseCase: asClass(GetAppointmentUseCase).singleton(), // [!code ++]
  updateAppointmentStatusUseCase: asClass(UpdateAppointmentStatusUseCase).singleton(),
  
  // Registramos los nuevos casos de uso específicos y eliminamos el genérico
  processAppointmentPEUseCase: asClass(ProcessAppointmentPEUseCase).singleton(),
  processAppointmentCLUseCase: asClass(ProcessAppointmentCLUseCase).singleton(),
});

export { container };