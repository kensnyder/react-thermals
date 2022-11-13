/**
 * Object representing an event that fires from Store.emit()
 */
export default class PreventableEvent {
  /**
   * The object that emitted the event
   */
  public target: any;

  /**
   * The event name
   */
  public type: string;

  /**
   * Data associated with the event
   */
  public data: any;

  /**
   * True if default behavior was prevented
   */
  public defaultPrevented: boolean;

  /**
   * True if other event handlers should be skipped
   */
  public propagationStopped: boolean;

  /**
   * @param target  The store that created the event
   * @param type  The event name
   * @param data  Any data associated with the event
   */
  constructor(target: any, type: string, data: any) {
    this.target = target;
    this.type = type;
    this.data = data;
    this.defaultPrevented = false;
    this.propagationStopped = false;
  }

  /**
   * Prevent the default behavior of this event
   */
  preventDefault(): void {
    this.defaultPrevented = true;
  }

  /**
   * Prevent other handlers from running
   */
  stopPropagation(): void {
    this.propagationStopped = true;
  }

  /**
   * Prevent other handlers from running
   */
  stopImmediatePropagation(): void {
    this.propagationStopped = true;
  }

  /**
   * Check if some handlers were skipped
   * @return
   */
  isPropagationStopped(): boolean {
    return this.propagationStopped;
  }
}
