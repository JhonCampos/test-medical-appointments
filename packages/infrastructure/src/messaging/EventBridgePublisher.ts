import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { IConfirmationPublisher } from '@core/domain/ports/IConfirmationPublisher';

/**
 * @description Publicador de eventos que utiliza AWS EventBridge.
 */
export class EventBridgePublisher implements IConfirmationPublisher {
  private readonly eventBridgeClient: EventBridgeClient;
  private readonly eventBusName = process.env.EVENT_BUS_NAME!;
  private readonly eventSource = 'appointment.processor';
  private readonly eventDetailType = 'AppointmentProcessed';

  constructor() {
    this.eventBridgeClient = new EventBridgeClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  /**
   * Publica un evento de confirmación en el bus de EventBridge.
   * @param detail El payload del evento.
   */
  async publish(detail: Record<string, any>): Promise<void> {
    const command = new PutEventsCommand({
      Entries: [
        {
          Source: this.eventSource,
          DetailType: this.eventDetailType,
          Detail: JSON.stringify(detail),
          EventBusName: this.eventBusName,
        },
      ],
    });

    try {
      await this.eventBridgeClient.send(command);
      console.log(`Event published successfully to EventBridge bus: ${this.eventBusName}`);
    } catch (error) {
      console.error('Error publishing event to EventBridge:', error);
      throw error;
    }
  }
}