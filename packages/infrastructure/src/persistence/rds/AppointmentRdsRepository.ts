import { createPool, Pool } from 'mysql2/promise';
import { Appointment } from '@core/domain/entities/Appointment';
import { IAppointmentRdsRepository } from '@core/application/use-cases/ProcessAppointment';

/**
 * @description Repositorio para manejar la persistencia de citas en una base de datos RDS (MySQL).
 * Asume una tabla `appointments` con la siguiente estructura (o similar):
 * CREATE TABLE appointments (
 * appointment_id VARCHAR(36) PRIMARY KEY,
 * insured_id VARCHAR(5) NOT NULL,
 * schedule_id INT NOT NULL,
 * country_iso VARCHAR(2) NOT NULL,
 * status VARCHAR(10) NOT NULL,
 * created_at TIMESTAMP NOT NULL
 * );
 */
export class AppointmentRdsRepository implements IAppointmentRdsRepository {
  private pool: Pool;

  constructor() {
    this.pool = createPool({
      host: process.env.RDS_HOST,
      user: process.env.RDS_USER,
      password: process.env.RDS_PASSWORD,
      database: process.env.RDS_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  /**
   * Guarda una cita en la base de datos MySQL.
   * @param appointment El objeto de la cita a persistir.
   */
  async save(appointment: Appointment): Promise<void> {
    const sql = `
      INSERT INTO appointments (appointment_id, insured_id, schedule_id, country_iso, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    try {
      await this.pool.execute(sql, [
        appointment.appointmentId,
        appointment.insuredId,
        appointment.scheduleId,
        appointment.countryISO,
        appointment.status,
        new Date(appointment.createdAt),
      ]);
      console.log(`Appointment ${appointment.appointmentId} saved to RDS.`);
    } catch (error) {
      console.error('Error saving appointment to RDS:', error);
      throw new Error('Failed to save appointment to RDS.');
    }
  }
}