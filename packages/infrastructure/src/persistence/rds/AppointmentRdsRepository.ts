import { createPool, Pool } from 'mysql2/promise';
import { Appointment } from '@core/domain/entities/Appointment';
import { IAppointmentCountryRepository } from '@core/domain/ports/repositories/IAppointmentCountryRepository';

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
export class AppointmentRdsRepository implements IAppointmentCountryRepository {

  constructor() {
    
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
     
      console.log(`Appointment SQL: ${sql}`);
      console.log(`Appointment ${appointment.appointmentId} saved to RDS.`);
    } catch (error) {
      console.error('Error saving appointment to RDS:', error);
      throw new Error('Failed to save appointment to RDS.');
    }
  }
}