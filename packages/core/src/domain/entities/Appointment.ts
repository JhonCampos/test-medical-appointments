import { z } from 'zod/v4';

export const AppointmentSchema = z.object({
  appointmentId: z.string(),
  insuredId: z.string().length(5),
  scheduleId: z.number().int().positive(),
  countryISO: z.enum(['PE', 'CL']),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED']),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Appointment = z.infer<typeof AppointmentSchema>;

export class AppointmentEntity {
  private props: Appointment;

  constructor(props: Appointment) {
    this.props = { ...props };
  }

  static create(props: Omit<Appointment, 'appointmentId' | 'status' | 'createdAt' | 'updatedAt'>): AppointmentEntity {
    const now = new Date().toISOString();
    return new AppointmentEntity({
      ...props,
      appointmentId: crypto.randomUUID(),
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    });
  }

  get values(): Appointment {
    return this.props;
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