import { SnsAppointmentEventDto } from '../dtos/AppointmentDtos';
import { IConfirmationPublisher } from '../../domain/ports/IConfirmationPublisher';
import { Appointment } from '../../domain/entities/Appointment';
import { IAppointmentCountryRepository } from '@core/domain/ports/repositories/IAppointmentCountryRepository';

/**
 * @description Caso de uso para procesar una cita de PERÚ.
 * Guarda en RDS y publica un evento de confirmación.
 */
export class ProcessAppointmentPEUseCase {
  constructor(
    private readonly countryRepository: IAppointmentCountryRepository,
    private readonly confirmationPublisher: IConfirmationPublisher
  ) {}

  /**
   * Ejecuta el caso de uso para Perú.
   * @param appointmentEvent El DTO del evento recibido de SNS.
   */
  async execute(appointmentEvent: SnsAppointmentEventDto): Promise<void> {
    const appointmentToSave: Appointment = {
      ...appointmentEvent,
      status: 'PENDING',
      updatedAt: new Date(appointmentEvent.createdAt).toISOString(),
    };

    // Aquí iría la futura lógica de negocio específica para Perú.
    console.log(`Executing Peru-specific appointment processing for ID: ${appointmentEvent.appointmentId}`);

    await this.countryRepository.save(appointmentToSave);

    await this.confirmationPublisher.publish({
      appointmentId: appointmentToSave.appointmentId,
      insuredId: appointmentToSave.insuredId,
      status: 'PROCESSED',
    });
  }
}