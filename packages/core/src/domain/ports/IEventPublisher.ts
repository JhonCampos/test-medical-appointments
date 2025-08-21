export interface IEventPublisher {
  publish(topic: string, event: Record<string, any>, attributes?: Record<string, any>): Promise<void>;
}