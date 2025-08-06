/**
 * Event Manager for Nocchino - Observer Pattern Implementation
 *
 * This module implements the Observer pattern to handle various events
 * that occur during the Nock repository lifecycle.
 */

import type {
  NockEventListener,
  IEventManager,
  RequestDetails,
  MockResponse,
  NocchinoError,
  OpenAPISpec,
  NocchinoEndpoint,
} from '../types';

import { debugRequest, debugError } from './debugger';

/**
 * Event Manager implementation using Observer pattern
 *
 * Manages event listeners and notifies them of various Nock-related events
 * such as request start/completion, errors, specification loading, etc.
 */
export class EventManager implements IEventManager {
  private listeners: NockEventListener[] = [];

  private isEnabled: boolean = true;

  /**
   * Add a new event listener
   * @param listener - The event listener to add
   */
  public addListener(listener: NockEventListener): void {
    if (!this.listeners.includes(listener)) {
      this.listeners.push(listener);
    }
  }

  /**
   * Remove an event listener
   * @param listener - The event listener to remove
   */
  public removeListener(listener: NockEventListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Remove all event listeners
   */
  public clearListeners(): void {
    this.listeners = [];
  }

  /**
   * Get the current number of listeners
   * @returns Number of active listeners
   */
  public getListenerCount(): number {
    return this.listeners.length;
  }

  /**
   * Enable or disable event notifications
   * @param enabled - Whether to enable event notifications
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if event notifications are enabled
   * @returns True if events are enabled
   */
  public isEventEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Notify all listeners of a request start event
   * @param request - The request details
   */
  public notifyRequestStarted(request: RequestDetails): void {
    if (!this.isEnabled) return;

    debugRequest(request);

    this.listeners.forEach((listener) => {
      try {
        listener.onRequestStarted(request);
      } catch (error) {
        // Silently handle listener errors to prevent cascading failures
      }
    });
  }

  /**
   * Notify all listeners of a request completion event
   * @param response - The mock response
   */
  public notifyRequestCompleted(response: MockResponse): void {
    if (!this.isEnabled) return;

    this.listeners.forEach((listener) => {
      try {
        listener.onRequestCompleted(response);
      } catch (error) {
        // Silently handle listener errors to prevent cascading failures
      }
    });
  }

  /**
   * Notify all listeners of an error event
   * @param error - The error that occurred
   */
  public notifyError(error: NocchinoError): void {
    if (!this.isEnabled) return;

    debugError(error, { context: 'event-manager' });

    this.listeners.forEach((listener) => {
      try {
        listener.onError(error);
      } catch (listenerError) {
        // Silently handle listener errors to prevent cascading failures
      }
    });
  }

  /**
   * Notify all listeners of a specification loaded event
   * @param spec - The loaded OpenAPI specification
   */
  public notifySpecificationLoaded(spec: OpenAPISpec): void {
    if (!this.isEnabled) return;

    this.listeners.forEach((listener) => {
      try {
        listener.onSpecificationLoaded(spec);
      } catch (error) {
        // Silently handle listener errors to prevent cascading failures
      }
    });
  }

  /**
   * Notify all listeners of an endpoint configuration event
   * @param endpoint - The configured endpoint
   */
  public notifyEndpointConfigured(endpoint: NocchinoEndpoint): void {
    if (!this.isEnabled) return;

    this.listeners.forEach((listener) => {
      try {
        listener.onEndpointConfigured(endpoint);
      } catch (error) {
        // Silently handle listener errors to prevent cascading failures
      }
    });
  }

  /**
   * Get a list of all registered listeners
   * @returns Array of listener names (for debugging)
   */
  public getListenerNames(): string[] {
    return this.listeners.map((listener) => listener.constructor.name);
  }
}

// Export singleton instance
export const eventManager = new EventManager();
