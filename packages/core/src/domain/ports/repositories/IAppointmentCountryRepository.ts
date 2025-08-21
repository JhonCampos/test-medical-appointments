import { Appointment } from "../../entities/Appointment";
export interface IAppointmentCountryRepository {
  save(appointment: Appointment): Promise<void>;
}