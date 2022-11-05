/**
 * Object representing an event that fires from Store.emit()
 */
export default class PreventableEvent {
  public target: any;
  public type: string;
  public data: any;
  public defaultPrevented: boolean;
  public propagationStopped: boolean;

  /**
   * @param {Store} target  The store that created the event
   * @param {String} type  The event name
   * @param {any} data  Any data associated with the event
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
   * @return {Boolean}
   */
  isPropagationStopped(): boolean {
    return this.propagationStopped;
  }
}
