import SimpleEmitter from './SimpleEmitter';

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
    emitter.emit('AfterUpdate', evt => {
      expect(evt.data).toBe(foo);
      expect(evt.type).toBe('AfterUpdate');
    });
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
    emitter.emit('AfterUpdate');
    expect(numCalls).toBe(2);
  });
});
