import SimpleEmitter from './SimpleEmitter';
import PreventableEvent from '../PreventableEvent/PreventableEvent';

describe('SimpleEmitter', () => {
  it('should have methods', () => {
    const emitter = new SimpleEmitter();
    expect(typeof emitter.emit).toBe('function');
  });
  it('should be chainable', () => {
    const emitter = new SimpleEmitter();
    const context = emitter.on('foo', () => {});
    expect(context).toBe(emitter);
  });
  it('should return basic object from emit()', () => {
    const foo = {};
    const emitter = new SimpleEmitter();
    const evt = emitter.emit('test', foo);
    expect(evt.data).toBe(foo);
    expect(evt.type).toBe('test');
  });
  it('should return a Preventable event from emit()', () => {
    const foo = {};
    const emitter = new SimpleEmitter();
    emitter.on('test', () => {});
    const evt = emitter.emit('test', foo);
    expect(evt).toBeInstanceOf(PreventableEvent);
    expect(evt.target).toBe(emitter);
    expect(evt.type).toBe('test');
  });
  it('should return the event from emit()', () => {
    const foo = {};
    const emitter = new SimpleEmitter();
    const evt = emitter.emit('test', foo);
    expect(evt).toBeInstanceOf(Object);
    expect(evt.data).toBe(foo);
    expect(evt.type).toBe('test');
  });
  it('should allow preventing default', () => {
    const emitter = new SimpleEmitter();
    emitter.on('test', evt => evt.preventDefault());
    const evt = emitter.emit('test');
    expect(evt.defaultPrevented).toBe(true);
    expect(evt.isPropagationStopped()).toBe(false);
  });
  it('should remove handlers for off()', () => {
    const emitter = new SimpleEmitter();
    let numCalls = 0;
    const handler = () => numCalls++;
    emitter.on('test', handler);
    emitter.off('test', handler);
    emitter.emit('test');
    expect(numCalls).toBe(0);
  });
  it('should support once()', () => {
    const emitter = new SimpleEmitter();
    let numCalls = 0;
    const handler = () => numCalls++;
    emitter.once('test', handler);
    emitter.emit('test');
    expect(numCalls).toBe(1);
    emitter.emit('test');
    expect(numCalls).toBe(1);
  });
  it('should do noop when calling off() without calling on() first', () => {
    const emitter = new SimpleEmitter();
    const remove = () => {
      const handler = () => {};
      emitter.off('test', handler);
    };
    expect(remove).not.toThrowError();
  });
  it('should allow subscribing to *', () => {
    const emitter = new SimpleEmitter();
    let numCalls = 0;
    emitter.on('*', () => numCalls++);
    emitter.emit('foo');
    emitter.emit('bar');
    expect(numCalls).toBe(2);
  });
  it('should stop propagation', () => {
    const emitter = new SimpleEmitter();
    let numCalls = 0;
    const handler = evt => {
      numCalls++;
      evt.stopPropagation();
    };
    emitter.on('test', handler);
    emitter.on('test', handler);
    const event = emitter.emit('test');
    expect(numCalls).toBe(1);
    expect(event.isPropagationStopped()).toBe(true);
  });
  it('should stop immediate propagation', () => {
    const emitter = new SimpleEmitter();
    let numCalls = 0;
    const handler = evt => {
      numCalls++;
      evt.stopImmediatePropagation();
    };
    emitter.on('test', handler);
    emitter.on('test', handler);
    const event = emitter.emit('test');
    expect(numCalls).toBe(1);
    expect(event.isPropagationStopped()).toBe(true);
  });
});
