import { UpdateAppointmentStatusUseCase } from '@core/application/use-cases/UpdateAppointmentStatus';
import { IAppointmentRepository } from '@core/domain/ports/repositories/IAppointmentRepository';
import { Appointment } from '@core/domain/entities/Appointment';
import { AppError, ErrorCode } from '@core/common/errors/AppError';

describe('UpdateAppointmentStatusUseCase', () => {
  let appointmentRepository: jest.Mocked<IAppointmentRepository>;
  let useCase: UpdateAppointmentStatusUseCase;

  beforeEach(() => {
    appointmentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      findByInsuredId: jest.fn(),
    };
    useCase = new UpdateAppointmentStatusUseCase(appointmentRepository);
  });

  it('debe actualizar el estado de una cita a COMPLETED', async () => {
    // Arrange
    const dto = { appointmentId: 'uuid-1', insuredId: '12345' };
    const existingAppointment: Appointment = {
      ...dto,
      scheduleId: 1,
      countryISO: 'PE',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    appointmentRepository.findById.mockResolvedValue(existingAppointment);

    // Act
    await useCase.execute(dto);

    // Assert
    expect(appointmentRepository.findById).toHaveBeenCalledWith(dto);
    expect(appointmentRepository.update).toHaveBeenCalledTimes(1);
    const updatedAppointment = appointmentRepository.update.mock.calls[0][0];
    expect(updatedAppointment.status).toBe('COMPLETED');
    expect(new Date(updatedAppointment.updatedAt).getTime()).toBeGreaterThan(new Date(existingAppointment.updatedAt).getTime());
  });

  it('debe lanzar un AppError si la cita no se encuentra', async () => {
    // Arrange
    const dto = { appointmentId: 'uuid-not-found', insuredId: '12345' };
    appointmentRepository.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute(dto)).rejects.toThrow(
      new AppError(
        `Appointment with ID ${dto.appointmentId} not found.`,
        ErrorCode.NotFound,
        404
      )
    );
  });
});