import { z } from 'zod/v4';

// Primero definimos el esquema de Appointment aquí para evitar importaciones circulares
export const AppointmentSchema = z.object({
  appointmentId: z.string(),
  insuredId: z.string().length(5),
  scheduleId: z.number().int().positive(),
  countryISO: z.enum(['PE', 'CL']),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED']),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

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
  createdAt: z.iso.datetime(),
});
export type SnsAppointmentEventDto = z.infer<typeof SnsAppointmentEventSchema>;

export const UpdateAppointmentStatusEventSchema = z.object({
  appointmentId: z.string(),
  insuredId: z.string(),
  status: z.literal('PROCESSED'),
});
export type UpdateAppointmentStatusEventDto = z.infer<typeof UpdateAppointmentStatusEventSchema>;

export const GetAppointmentRequestSchema = z.object({ 
  insuredId: z.string().regex(/^[0-9]{5}$/, "El insuredId debe ser de 5 dígitos numéricos."), // [!code ++]
  appointmentId: z.string().uuid("El appointmentId debe ser un UUID válido."), // [!code ++]
});
export type GetAppointmentRequestDto = z.infer<typeof GetAppointmentRequestSchema>; // [!code ++]
