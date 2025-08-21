import { SnsAppointmentEventDto } from '../dtos/AppointmentDtos';
import { IConfirmationPublisher } from '../../domain/ports/IConfirmationPublisher';
import { Appointment } from '../../domain/entities/Appointment';

// Creamos una interfaz simple para el repositorio de RDS en la capa de aplicación
// para no depender directamente de la implementación de infra.
export interface IAppointmentRdsRepository {
  save(appointment: Appointment): Promise<void>;
}

/**
 * @description Caso de uso para procesar una cita, guardarla en la base de datos
 * secundaria (RDS) y publicar un evento de confirmación.
 */
export class ProcessAppointmentUseCase {
  constructor(
    private readonly rdsRepository: IAppointmentRdsRepository,
    private readonly confirmationPublisher: IConfirmationPublisher
  ) {}

  /**
   * Ejecuta el caso de uso.
   * @param appointmentEvent El DTO del evento recibido de SNS.
   */
  async execute(appointmentEvent: SnsAppointmentEventDto): Promise<void> {
    // 1. Reconstruir la entidad Appointment para la persistencia
    const appointmentToSave: Appointment = {
      ...appointmentEvent,
      status: 'PENDING', // El estado inicial se guarda en RDS
      updatedAt: new Date(appointmentEvent.createdAt).toISOString(),
    };

    // 2. Guardar en la base de datos RDS
    await this.rdsRepository.save(appointmentToSave);

    // 3. Publicar evento de confirmación
    await this.confirmationPublisher.publish({
      appointmentId: appointmentToSave.appointmentId,
      insuredId: appointmentToSave.insuredId,
      status: 'PROCESSED',
    });
  }
}