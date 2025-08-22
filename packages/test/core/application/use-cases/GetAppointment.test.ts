// packages/test/core/application/use-cases/GetAppointment.test.ts

import { GetAppointmentUseCase } from '@core/application/use-cases/GetAppointment';
import { IAppointmentRepository } from '@core/domain/ports/repositories/IAppointmentRepository';
import { Appointment } from '@core/domain/entities/Appointment';
import { NotFoundError } from '@core/common/errors/AppError';

describe('GetAppointmentUseCase', () => {
  let appointmentRepository: jest.Mocked<IAppointmentRepository>;
  let getAppointmentUseCase: GetAppointmentUseCase;

  beforeEach(() => {
    appointmentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      findByInsuredId: jest.fn(),
    };
    getAppointmentUseCase = new GetAppointmentUseCase(appointmentRepository);
  });

  it('debe devolver los datos de una cita si se encuentra', async () => {
    // Arrange
    const dto = { insuredId: '12345', appointmentId: 'uuid-1' };
    const mockAppointment: Appointment = {
      ...dto,
      scheduleId: 101,
      countryISO: 'PE',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    appointmentRepository.findById.mockResolvedValue(mockAppointment);

    // Act
    const result = await getAppointmentUseCase.execute(dto);

    // Assert
    expect(appointmentRepository.findById).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockAppointment);
  });

  it('debe lanzar un NotFoundError si la cita no se encuentra', async () => {
    // Arrange
    const dto = { insuredId: '12345', appointmentId: 'uuid-not-found' };
    appointmentRepository.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(getAppointmentUseCase.execute(dto)).rejects.toThrow(NotFoundError);
    await expect(getAppointmentUseCase.execute(dto)).rejects.toThrow(
      `No se encontró la cita con ID ${dto.appointmentId}.`
    );
  });
});