import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { IAppointmentRepository } from '@core/domain/ports/repositories/IAppointmentRepository';
import { Appointment } from '@core/domain/entities/Appointment';

export class DynamoDbAppointmentRepository implements IAppointmentRepository {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName = process.env.DYNAMODB_TABLE_APPOINTMENTS!;

  constructor() {
    const client = new DynamoDBClient({
      endpoint: process.env.IS_OFFLINE ? 'http://localhost:8000' : undefined,
    });
    this.docClient = DynamoDBDocumentClient.from(client);
  }

  async save(appointment: Appointment): Promise<void> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: appointment,
    });
    await this.docClient.send(command);
  }

  async findById(keys: { appointmentId: string; insuredId: string }): Promise<Appointment | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        insuredId: keys.insuredId,
        appointmentId: keys.appointmentId,
      },
    });
    const { Item } = await this.docClient.send(command);
    return (Item as Appointment) || null;
  }

  async update(appointment: Appointment): Promise<void> {
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        insuredId: appointment.insuredId,
        appointmentId: appointment.appointmentId,
      },
      UpdateExpression: 'set #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status', // 'status' es una palabra reservada en DynamoDB
      },
      ExpressionAttributeValues: {
        ':status': appointment.status,
        ':updatedAt': appointment.updatedAt,
      },
    });
    await this.docClient.send(command);
  }
  
  async findByInsuredId(insuredId: string): Promise<Appointment[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'insuredId = :insuredId',
      ExpressionAttributeValues: {
        ':insuredId': insuredId,
      },
    });

    const { Items } = await this.docClient.send(command);
    return (Items as Appointment[]) || [];
  }
}