import { Appointment } from '../../domain/entities/Appointment';
import { IAppointmentRepository } from '../../domain/ports/repositories/IAppointmentRepository';

/**
 * @description Caso de uso para listar citas médicas por el ID del asegurado.
 */
export class ListAppointmentsUseCase {
  /**
   * @param appointmentRepository El repositorio para acceder a los datos de las citas.
   */
  constructor(
    private readonly appointmentRepository: IAppointmentRepository
  ) {}

  /**
   * Ejecuta el caso de uso.
   * @param insuredId El ID del asegurado.
   * @returns Una promesa que se resuelve con un arreglo de citas.
   */
  async execute(insuredId: string): Promise<Appointment[]> {
    return this.appointmentRepository.findByInsuredId(insuredId);
  }
}