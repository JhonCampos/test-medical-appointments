import { CreateAppointmentUseCase } from '@core/application/use-cases/CreateAppointment';
import { IAppointmentRepository } from '@core/domain/ports/repositories/IAppointmentRepository';
import { IEventPublisher } from '@core/domain/ports/IEventPublisher';
import { CreateAppointmentDto } from '@core/application/dtos/AppointmentDtos';

// Mockear crypto.randomUUID para tener un ID predecible en las pruebas
const MOCK_APPOINTMENT_ID = 'e7a4b0c4-9a2d-4f1e-8c6c-5e4a3b2a1f0e';
global.crypto = {
  ...global.crypto,
  randomUUID: () => MOCK_APPOINTMENT_ID,
};

describe('CreateAppointmentUseCase', () => {
  let appointmentRepository: jest.Mocked<IAppointmentRepository>;
  let eventPublisher: jest.Mocked<IEventPublisher>;
  let createAppointmentUseCase: CreateAppointmentUseCase;

  beforeEach(() => {
    appointmentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      findByInsuredId: jest.fn(),
    };

    eventPublisher = {
      publish: jest.fn(),
    };

    createAppointmentUseCase = new CreateAppointmentUseCase(
      appointmentRepository,
      eventPublisher,
    );
  });

  it('debe crear una cita, guardarla en el repositorio y publicar un evento', async () => {
    // Arrange
    const dto: CreateAppointmentDto = {
      insuredId: '54321',
      scheduleId: 200,
      countryISO: 'CL',
    };

    // Act
    const result = await createAppointmentUseCase.execute(dto);

    // Assert
    expect(appointmentRepository.save).toHaveBeenCalledTimes(1);
    const savedAppointment = appointmentRepository.save.mock.calls[0][0];
    expect(savedAppointment).toMatchObject({
      appointmentId: MOCK_APPOINTMENT_ID,
      insuredId: '54321',
      scheduleId: 200,
      countryISO: 'CL',
      status: 'PENDING',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
    const [topic, eventPayload, attributes] = eventPublisher.publish.mock.calls[0];
    expect(topic).toBe('AppointmentRequested');
    expect(eventPayload).toMatchObject({
      appointmentId: MOCK_APPOINTMENT_ID,
      insuredId: '54321',
      scheduleId: 200,
      countryISO: 'CL',
      createdAt: savedAppointment.createdAt,
    });
    expect(attributes).toEqual({
      countryISO: {
        DataType: 'String',
        StringValue: 'CL',
      },
    });

    expect(result).toEqual(savedAppointment);
  });
});