import createStore from '../../src/createStore/createStore.js';
import consoleLogger from './consoleLogger.js';

describe('consoleLogger plugin', () => {
  let spy, store;
  beforeEach(() => {
    spy = jest.spyOn(console, 'log');
    spy.mockImplementation(() => {});
    store = createStore({ id: 'myStore' });
  });
  afterEach(() => {
    spy.mockRestore();
  });
  it('should log on events', () => {
    store.plugin(
      consoleLogger({
        eventTypes: ['foo'],
      })
    );
    store.emit('foo', { myData: 42 });
    expect(spy.mock.calls[0][0].storeId).toBe('myStore');
    expect(spy.mock.calls[0][0].eventType).toBe('foo');
    expect(spy.mock.calls[0][0].event.data.myData).toBe(42);
  });
  it('should default empty object to *', () => {
    store.plugin(consoleLogger({}));
    store.emit('foo2', { myData: 43 });
    expect(spy.mock.calls[0][0].storeId).toBe('myStore');
    expect(spy.mock.calls[0][0].eventType).toBe('foo2');
    expect(spy.mock.calls[0][0].event.data.myData).toBe(43);
  });
  it('should default missing argument to *', () => {
    store.plugin(consoleLogger());
    store.emit('foo3', { myData: 44 });
    expect(spy.mock.calls[0][0].storeId).toBe('myStore');
    expect(spy.mock.calls[0][0].eventType).toBe('foo3');
    expect(spy.mock.calls[0][0].event.data.myData).toBe(44);
  });
  it('should ignore unspecified events', () => {
    store.plugin(
      consoleLogger({
        eventTypes: ['bar'],
      })
    );
    store.emit('foo');
    expect(spy).not.toHaveBeenCalled();
  });
});
describe('consoleLogger plugin errors', () => {
  let store;
  beforeEach(() => {
    store = createStore({ id: 'myStore' });
  });
  it('should error if eventTypes is not an array', () => {
    const thrower = () => {
      store.plugin(
        consoleLogger({
          eventTypes: 17,
        })
      );
    };
    expect(thrower).toThrowError();
  });
  it('should error if eventTypes is an empty array', () => {
    const thrower = () => {
      store.plugin(
        consoleLogger({
          eventTypes: [],
        })
      );
    };
    expect(thrower).toThrowError();
  });
});
