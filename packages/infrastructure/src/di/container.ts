import { createContainer, asClass, InjectionMode } from 'awilix';
import { CreateAppointmentUseCase } from '@core/application/use-cases/CreateAppointment';
import { ListAppointmentsUseCase } from '@core/application/use-cases/ListAppointments';
import { UpdateAppointmentStatusUseCase } from '@core/application/use-cases/UpdateAppointmentStatus';
// Importamos los nuevos casos de uso
import { ProcessAppointmentPEUseCase } from '@core/application/use-cases/ProcessAppointmentPE';
import { ProcessAppointmentCLUseCase } from '@core/application/use-cases/ProcessAppointmentCL';
import { DynamoDbAppointmentRepository } from '../persistence/dynamodb/AppointmentRepository';
import { SnsEventPublisher } from '../messaging/SnsEventPublisher';
import { AppointmentRdsRepository } from '../persistence/rds/AppointmentRdsRepository';
import { EventBridgePublisher } from '../messaging/EventBridgePublisher';

const container = createContainer({
  injectionMode: InjectionMode.PROXY,
});

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
  
  // Registramos los nuevos casos de uso específicos y eliminamos el genérico
  processAppointmentPEUseCase: asClass(ProcessAppointmentPEUseCase).singleton(),
  processAppointmentCLUseCase: asClass(ProcessAppointmentCLUseCase).singleton(),
});

export { container };