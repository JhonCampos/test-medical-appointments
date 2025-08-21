import { AppointmentEntity } from '../../domain/entities/Appointment';
import { IAppointmentRepository } from '../../domain/ports/repositories/IAppointmentRepository';
import { AppError, ErrorCode, HttpStatusCode } from '../../common/errors/AppError';

interface UpdateAppointmentStatusDto {
  appointmentId: string;
  insuredId: string;
}

/**
 * @description Caso de uso para actualizar el estado de una cita a 'COMPLETED'.
 */
export class UpdateAppointmentStatusUseCase {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository
  ) {}

  /**
   * Ejecuta el caso de uso.
   * @param dto El DTO con los identificadores de la cita.
   */
  async execute(dto: UpdateAppointmentStatusDto): Promise<void> {
    const { appointmentId, insuredId } = dto;

    // 1. Encontrar la cita existente
    const existingAppointment = await this.appointmentRepository.findById({ appointmentId, insuredId });

    if (!existingAppointment) {
      // En un sistema real, podríamos mover este mensaje a una DLQ o registrar una alerta.
      // Por ahora, lanzamos un error para indicar que la cita no fue encontrada.
      throw new AppError(
        `Appointment with ID ${appointmentId} not found.`,
        ErrorCode.NotFound,
        HttpStatusCode.NOT_FOUND
      );
    }
    
    // 2. Rehidratar la entidad de dominio
    const appointmentEntity = new AppointmentEntity(existingAppointment);

    // 3. Ejecutar la lógica de dominio para completar la cita
    appointmentEntity.complete();

    // 4. Persistir los cambios usando el repositorio
    await this.appointmentRepository.update(appointmentEntity.values);
    
    console.log(`Appointment ${appointmentId} status updated to COMPLETED.`);
  }
}