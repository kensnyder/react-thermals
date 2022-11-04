/**
 * Object representing an event that fires from Store.emit()
 */
export default class PreventableEvent {
	public target: any;
	public type: any;
	public data: any;
	public defaultPrevented: any;
	public propagationStopped: any;

  /**
   * @param {Store} target  The store that created the event
   * @param {String} type  The event name
   * @param {any} data  Any data associated with the event
   */
  constructor(target, type, data) {
    this.target = target;
    this.type = type;
    this.data = data;
    this.defaultPrevented = false;
    this.propagationStopped = false;
  }

  /**
   * Prevent the default behavior of this event
   */
  preventDefault() {
    this.defaultPrevented = true;
  }

  /**
   * Prevent other handlers from running
   */
  stopPropagation() {
    this.propagationStopped = true;
  }

  /**
   * Prevent other handlers from running
   */
  stopImmediatePropagation() {
    this.propagationStopped = true;
  }

  /**
   * Check if some handlers were skipped
   * @return {Boolean}
   */
  isPropagationStopped() {
    return this.propagationStopped;
  }
}
