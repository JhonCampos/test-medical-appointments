import { SNSClient, PublishCommand, MessageAttributeValue } from '@aws-sdk/client-sns';
import { IEventPublisher } from '@core/domain/ports/IEventPublisher';

/**
 * @description Implementación de IEventPublisher que publica eventos en un tópico de AWS SNS.
 */
export class SnsEventPublisher implements IEventPublisher {
  private readonly snsClient: SNSClient;
  private readonly topicArn = process.env.SNS_TOPIC_APPOINTMENTS_ARN!;

  constructor() {
    this.snsClient = new SNSClient({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.IS_OFFLINE ? 'http://localhost:4002' : undefined,
    });
  }

  /**
   * Publica un evento en el tópico SNS configurado.
   * @param topic El nombre lógico del tema (no se usa directamente, se usa el ARN de la variable de entorno).
   * @param event El objeto del evento a publicar.
   * @param attributes Atributos del mensaje para filtrado en SNS.
   */
  async publish(topic: string, event: Record<string, any>, attributes?: Record<string, MessageAttributeValue>): Promise<void> {
    const command = new PublishCommand({
      TopicArn: this.topicArn,
      Message: JSON.stringify(event),
      MessageAttributes: attributes,
    });

    try {
      await this.snsClient.send(command);
      console.log(`Event published successfully to SNS topic: ${this.topicArn}`);
    } catch (error) {
      console.error('Error publishing event to SNS:', error);
      // En un caso real, aquí se podría implementar una estrategia de reintentos o "dead-letter queue".
      throw error;
    }
  }
}