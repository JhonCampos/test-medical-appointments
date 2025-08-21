/**
 * @description Interfaz para un publicador de eventos de confirmación de procesamiento.
 */
export interface IConfirmationPublisher {
  /**
   * Publica un evento de confirmación.
   * @param eventDetail El payload del evento.
   */
  publish(eventDetail: Record<string, any>): Promise<void>;
}