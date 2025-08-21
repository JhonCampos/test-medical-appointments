import { ListAppointmentsUseCase } from '@core/application/use-cases/ListAppointments';
import { IAppointmentRepository } from '@core/domain/ports/repositories/IAppointmentRepository';
import { Appointment } from '@core/domain/entities/Appointment';

describe('ListAppointmentsUseCase', () => {
  let appointmentRepository: jest.Mocked<IAppointmentRepository>;
  let listAppointmentsUseCase: ListAppointmentsUseCase;

  beforeEach(() => {
    appointmentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      findByInsuredId: jest.fn(),
    };
    listAppointmentsUseCase = new ListAppointmentsUseCase(appointmentRepository);
  });

  it('debe devolver una lista de citas para un asegurado existente', async () => {
    // Arrange
    const insuredId = '11223';
    const mockAppointments: Appointment[] = [
      {
        appointmentId: 'uuid-1',
        insuredId,
        scheduleId: 1,
        countryISO: 'PE',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        appointmentId: 'uuid-2',
        insuredId,
        scheduleId: 2,
        countryISO: 'PE',
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    appointmentRepository.findByInsuredId.mockResolvedValue(mockAppointments);

    // Act
    const result = await listAppointmentsUseCase.execute(insuredId);

    // Assert
    expect(appointmentRepository.findByInsuredId).toHaveBeenCalledWith(insuredId);
    expect(result).toHaveLength(2);
    expect(result).toEqual(mockAppointments);
  });

  it('debe devolver un arreglo vacío si el asegurado no tiene citas', async () => {
    // Arrange
    const insuredId = '33445';
    appointmentRepository.findByInsuredId.mockResolvedValue([]);

    // Act
    const result = await listAppointmentsUseCase.execute(insuredId);

    // Assert
    expect(appointmentRepository.findByInsuredId).toHaveBeenCalledWith(insuredId);
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });
});