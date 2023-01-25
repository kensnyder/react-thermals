import SimpleEmitter from './SimpleEmitter';
import PreventableEvent from '../PreventableEvent/PreventableEvent';

describe('SimpleEmitter', () => {
  it('should have methods', () => {
    const emitter = new SimpleEmitter();
    expect(typeof emitter.emit).toBe('function');
  });
  it('should be chainable', () => {
    const emitter = new SimpleEmitter();
    const context = emitter.on('BeforeFirstUse', () => {});
    expect(context).toBe(emitter);
  });
  it('should return basic object from emit()', () => {
    const foo = {};
    const emitter = new SimpleEmitter();
    const evt = emitter.emit('AfterUpdate', foo);
    expect(evt.data).toBe(foo);
    expect(evt.type).toBe('AfterUpdate');
  });
  it('should return a Preventable event from emit()', () => {
    const foo = {};
    const emitter = new SimpleEmitter();
    emitter.on('AfterUpdate', () => {});
    const evt = emitter.emit('AfterUpdate', foo);
    expect(evt).toBeInstanceOf(PreventableEvent);
    expect(evt.target).toBe(emitter);
    expect(evt.type).toBe('AfterUpdate');
  });
  it('should return the event from emit()', () => {
    const foo = {};
    const emitter = new SimpleEmitter();
    const evt = emitter.emit('AfterUpdate', foo);
    expect(evt).toBeInstanceOf(Object);
    expect(evt.data).toBe(foo);
    expect(evt.type).toBe('AfterUpdate');
  });
  it('should allow preventing default', () => {
    const emitter = new SimpleEmitter();
    emitter.on('AfterUpdate', evt => evt.preventDefault());
    const evt = emitter.emit('AfterUpdate');
    expect(evt.defaultPrevented).toBe(true);
    expect(evt.isPropagationStopped()).toBe(false);
  });
  it('should remove handlers for off()', () => {
    const emitter = new SimpleEmitter();
    let numCalls = 0;
    const handler = () => numCalls++;
    emitter.on('AfterUpdate', handler);
    emitter.off('AfterUpdate', handler);
    emitter.emit('AfterUpdate');
    expect(numCalls).toBe(0);
  });
  it('should support once()', () => {
    const emitter = new SimpleEmitter();
    let numCalls = 0;
    const handler = () => numCalls++;
    emitter.once('AfterUpdate', handler);
    emitter.emit('AfterUpdate');
    expect(numCalls).toBe(1);
    emitter.emit('AfterUpdate');
    expect(numCalls).toBe(1);
  });
  it('should do noop when calling off() without calling on() first', () => {
    const emitter = new SimpleEmitter();
    const remove = () => {
      const handler = () => {};
      emitter.off('AfterUpdate', handler);
    };
    expect(remove).not.toThrowError();
  });
  it('should allow subscribing to *', () => {
    const emitter = new SimpleEmitter();
    let numCalls = 0;
    emitter.on('*', () => numCalls++);
    emitter.emit('BeforeFirstUse');
    emitter.emit('BeforeUpdate');
    expect(numCalls).toBe(2);
  });
  it('should stop propagation', () => {
    const emitter = new SimpleEmitter();
    let numCalls = 0;
    const handler = evt => {
      numCalls++;
      evt.stopPropagation();
    };
    emitter.on('AfterUpdate', handler);
    emitter.on('AfterUpdate', handler);
    const event = emitter.emit('AfterUpdate');
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
    emitter.on('AfterUpdate', handler);
    emitter.on('AfterUpdate', handler);
    const event = emitter.emit('AfterUpdate');
    expect(numCalls).toBe(1);
    expect(event.isPropagationStopped()).toBe(true);
  });
});
