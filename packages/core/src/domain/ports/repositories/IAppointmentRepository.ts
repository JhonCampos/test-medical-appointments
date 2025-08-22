import { Appointment } from "../../entities/Appointment";

export interface IAppointmentRepository {
  save(appointment: Appointment): Promise<void>;
  findById(keys: { appointmentId: string, insuredId: string }): Promise<Appointment | null>; // [!code ++]
  update(appointment: Appointment): Promise<void>; 
  findByInsuredId(insuredId: string): Promise<Appointment[]>;
}