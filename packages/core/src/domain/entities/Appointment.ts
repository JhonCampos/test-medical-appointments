import { AppointmentSchema } from "@core/application/dtos/AppointmentDtos";
import { z } from "zod/v4";

export type Appointment = z.infer<typeof AppointmentSchema>;

export class AppointmentEntity {
  private props: Appointment;

  constructor(props: Appointment) {
    // Validamos los props al construir la entidad
    this.props = AppointmentSchema.parse(props);
  }

  static create(props: Omit<Appointment, 'appointmentId' | 'status' | 'createdAt' | 'updatedAt'>): AppointmentEntity {
    const now = new Date().toISOString();
    const appointmentData: Appointment = {
      ...props,
      appointmentId: crypto.randomUUID(),
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };
    
    return new AppointmentEntity(appointmentData);
  }

  get values(): Appointment {
    return { ...this.props };
  }

  complete(): void {
    if (this.props.status !== 'PENDING') {
      // Aquí podrías lanzar un DomainError si fuera necesario
      return;
    }
    this.props.status = 'COMPLETED';
    this.props.updatedAt = new Date().toISOString();
  }
}