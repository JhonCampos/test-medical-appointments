// packages/core/src/application/use-cases/GetAppointment.ts

import { IAppointmentRepository } from '../../domain/ports/repositories/IAppointmentRepository';
import { AppointmentResponseDto } from '../dtos/AppointmentDtos';
import { NotFoundError } from '../../common/errors/AppError';

interface GetAppointmentDto {
  insuredId: string;
  appointmentId: string;
}

/**
 * @description Caso de uso para obtener los detalles de una cita específica.
 */
export class GetAppointmentUseCase {
  /**
   * @param appointmentRepository El repositorio para acceder a los datos de las citas.
   */
  constructor(
    private readonly appointmentRepository: IAppointmentRepository
  ) {}

  /**
   * Ejecuta el caso de uso.
   * @param dto El DTO con los identificadores de la cita.
   * @returns Una promesa que se resuelve con los datos de la cita.
   * @throws {NotFoundError} Si la cita no se encuentra.
   */
  async execute(dto: GetAppointmentDto): Promise<AppointmentResponseDto> {
    const appointment = await this.appointmentRepository.findById({
      insuredId: dto.insuredId,
      appointmentId: dto.appointmentId,
    });

    if (!appointment) {
      throw new NotFoundError(`No se encontró la cita con ID ${dto.appointmentId}.`);
    }

    return appointment;
  }
}