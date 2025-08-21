import { ProcessAppointmentCLUseCase } from '@core/application/use-cases/ProcessAppointmentCL';
import { IAppointmentCountryRepository } from '@core/domain/ports/repositories/IAppointmentCountryRepository';
import { IConfirmationPublisher } from '@core/domain/ports/IConfirmationPublisher';
import { SnsAppointmentEventDto } from '@core/application/dtos/AppointmentDtos';

describe('ProcessAppointmentCLUseCase', () => {
  let rdsRepository: jest.Mocked<IAppointmentCountryRepository>;
  let confirmationPublisher: jest.Mocked<IConfirmationPublisher>;
  let useCase: ProcessAppointmentCLUseCase;

  beforeEach(() => {
    rdsRepository = { save: jest.fn() };
    confirmationPublisher = { publish: jest.fn() };
    useCase = new ProcessAppointmentCLUseCase(rdsRepository, confirmationPublisher);
  });

  it('debe guardar la cita en RDS y publicar un evento de confirmación', async () => {
    // Arrange
    const eventDto: SnsAppointmentEventDto = {
      appointmentId: 'uuid-cl-1',
      insuredId: '55555',
      scheduleId: 400,
      countryISO: 'CL',
      createdAt: new Date().toISOString(),
    };

    // Act
    await useCase.execute(eventDto);

    // Assert
    expect(rdsRepository.save).toHaveBeenCalledTimes(1);
    const savedAppointment = rdsRepository.save.mock.calls[0][0];
    expect(savedAppointment).toMatchObject({
      ...eventDto,
      status: 'PENDING',
      updatedAt: eventDto.createdAt,
    });

    expect(confirmationPublisher.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = confirmationPublisher.publish.mock.calls[0][0];
    expect(publishedEvent).toEqual({
      appointmentId: eventDto.appointmentId,
      insuredId: eventDto.insuredId,
      status: 'PROCESSED',
    });
  });
});