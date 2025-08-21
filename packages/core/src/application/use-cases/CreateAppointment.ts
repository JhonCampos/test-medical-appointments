import { AppointmentEntity } from '../../domain/entities/Appointment';
import { IAppointmentRepository } from '../../domain/ports/repositories/IAppointmentRepository';
import { IEventPublisher } from '../../domain/ports/IEventPublisher';
import { CreateAppointmentDto, AppointmentResponseDto } from '../dtos/AppointmentDtos';

export class CreateAppointmentUseCase {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(dto: CreateAppointmentDto): Promise<AppointmentResponseDto> {
    const appointmentEntity = AppointmentEntity.create(dto);
    const appointment = appointmentEntity.values;

    await this.appointmentRepository.save(appointment);

    await this.eventPublisher.publish('AppointmentRequested', {
      appointmentId: appointment.appointmentId,
      insuredId: appointment.insuredId,
      scheduleId: appointment.scheduleId,
      countryISO: appointment.countryISO,
      createdAt: appointment.createdAt,
    }, {
      countryISO: {
        DataType: 'String',
        StringValue: appointment.countryISO,
      }
    });
    
    return appointment;
  }
}