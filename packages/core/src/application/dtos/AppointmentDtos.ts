import { z } from 'zod/v4';
import { AppointmentSchema } from '../../domain/entities/Appointment';

export const CreateAppointmentSchema = z.object({
  insuredId: z.string().regex(/^[0-9]{5}$/, "El insuredId debe ser de 5 dígitos numéricos."),
  scheduleId: z.number().int().positive(),
  countryISO: z.enum(['PE', 'CL']),
});
export type CreateAppointmentDto = z.infer<typeof CreateAppointmentSchema>;

export const ListAppointmentsRequestSchema = z.object({
  insuredId: z.string().regex(/^[0-9]{5}$/, "El insuredId debe ser de 5 dígitos numéricos."),
});
export type ListAppointmentsRequestDto = z.infer<typeof ListAppointmentsRequestSchema>;

export const AppointmentResponseSchema = AppointmentSchema;
export type AppointmentResponseDto = z.infer<typeof AppointmentResponseSchema>;

export const SnsAppointmentEventSchema = z.object({
  appointmentId: z.string(),
  insuredId: z.string(),
  scheduleId: z.number(),
  countryISO: z.enum(['PE', 'CL']),
  createdAt: z.string().datetime(),
});
export type SnsAppointmentEventDto = z.infer<typeof SnsAppointmentEventSchema>;

export const UpdateAppointmentStatusEventSchema = z.object({
  appointmentId: z.string(),
  insuredId: z.string(),
  status: z.literal('PROCESSED'),
});