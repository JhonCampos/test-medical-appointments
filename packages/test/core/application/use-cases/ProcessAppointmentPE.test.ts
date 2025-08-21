import { ProcessAppointmentPEUseCase } from '@core/application/use-cases/ProcessAppointmentPE';
import { IAppointmentCountryRepository } from '@core/domain/ports/repositories/IAppointmentCountryRepository';
import { IConfirmationPublisher } from '@core/domain/ports/IConfirmationPublisher';
import { SnsAppointmentEventDto } from '@core/application/dtos/AppointmentDtos';

describe('ProcessAppointmentPEUseCase', () => {
  let rdsRepository: jest.Mocked<IAppointmentCountryRepository>;
  let confirmationPublisher: jest.Mocked<IConfirmationPublisher>;
  let useCase: ProcessAppointmentPEUseCase;

  beforeEach(() => {
    rdsRepository = { save: jest.fn() };
    confirmationPublisher = { publish: jest.fn() };
    useCase = new ProcessAppointmentPEUseCase(rdsRepository, confirmationPublisher);
  });

  it('debe guardar la cita en RDS y publicar un evento de confirmación', async () => {
    // Arrange
    const eventDto: SnsAppointmentEventDto = {
      appointmentId: 'uuid-pe-1',
      insuredId: '98765',
      scheduleId: 300,
      countryISO: 'PE',
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