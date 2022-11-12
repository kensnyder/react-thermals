import Store from '../../class/Store/Store';
import { setter, setterInput, setterSync } from './setter';

function getTestStore(initialState) {
  return new Store({ state: initialState });
}
describe('setter(propName)', () => {
  it('should set scalar value', async () => {
    const store = getTestStore({ genre: 'classical', century: 16 });
    const setCentury = setter('century').bind(store);
    setCentury(17);
    await new Promise(r => setTimeout(r, 150));
    expect(store.getState()).toEqual({ genre: 'classical', century: 17 });
  });
  it('should set with callback', async () => {
    const store = getTestStore({ genre: 'classical', century: 18 });
    const setCentury = setter('century').bind(store);
    setCentury(old => old + 1);
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ genre: 'classical', century: 19 });
  });
});
describe('setterSync(propName)', () => {
  it('should set scalar value', () => {
    const store = getTestStore({ genre: 'classical', century: 16 });
    const setCentury = setterSync('century').bind(store);
    setCentury(17);
    expect(store.getState()).toEqual({ genre: 'classical', century: 17 });
  });
  it('should set with callback', () => {
    const store = getTestStore({ genre: 'classical', century: 18 });
    const setCentury = setterSync('century').bind(store);
    setCentury(old => old + 1);
    expect(store.getState()).toEqual({ genre: 'classical', century: 19 });
  });
});
describe('setterInput(propName)', () => {
  it('should set scalar value', () => {
    const store = getTestStore({ genre: 'classical', century: 16 });
    const setCentury = setterInput('century').bind(store);
    setCentury({ target: { value: 17 } });
    expect(store.getState()).toEqual({ genre: 'classical', century: 17 });
  });
});
