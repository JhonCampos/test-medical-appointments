import { createContainer, asClass, InjectionMode } from 'awilix';
import { CreateAppointmentUseCase } from '@core/application/use-cases/CreateAppointment';
import { ListAppointmentsUseCase } from '@core/application/use-cases/ListAppointments';
import { UpdateAppointmentStatusUseCase } from '@core/application/use-cases/UpdateAppointmentStatus';
import { ProcessAppointmentUseCase } from '@core/application/use-cases/ProcessAppointment';
import { DynamoDbAppointmentRepository } from '../persistence/dynamodb/AppointmentRepository';
import { SnsEventPublisher } from '../messaging/SnsEventPublisher';
import { AppointmentRdsRepository } from '../persistence/rds/AppointmentRdsRepository';
import { EventBridgePublisher } from '../messaging/EventBridgePublisher';

const container = createContainer({
  injectionMode: InjectionMode.PROXY,
});

// Contenedor Centralizado para todos los servicios
container.register({
  // Repositorios
  appointmentRepository: asClass(DynamoDbAppointmentRepository).singleton(),
  rdsRepository: asClass(AppointmentRdsRepository).singleton(),
  
  // Publicadores de Eventos
  eventPublisher: asClass(SnsEventPublisher).singleton(),
  confirmationPublisher: asClass(EventBridgePublisher).singleton(),

  // Casos de Uso
  createAppointmentUseCase: asClass(CreateAppointmentUseCase).singleton(),
  listAppointmentsUseCase: asClass(ListAppointmentsUseCase).singleton(),
  updateAppointmentStatusUseCase: asClass(UpdateAppointmentStatusUseCase).singleton(),
  processAppointmentUseCase: asClass(ProcessAppointmentUseCase).singleton(),
});

export { container };