import createStore from '../src/createStore/createStore.js';
import {
  fieldSetter,
  fieldSetterInput,
  fieldSetterSync,
} from './fieldSetter.js';

function getTestStore(initialState) {
  return createStore({ state: initialState });
}
describe('fieldSetter(propName)', () => {
  it('should set scalar value', async () => {
    const store = getTestStore({ genre: 'classical', century: 16 });
    const setCentury = fieldSetter('century').bind(store);
    setCentury(17);
    await new Promise(r => setTimeout(r, 150));
    expect(store.getState()).toEqual({ genre: 'classical', century: 17 });
  });
  it('should set with callback', async () => {
    const store = getTestStore({ genre: 'classical', century: 18 });
    const setCentury = fieldSetter('century').bind(store);
    setCentury(old => old + 1);
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({ genre: 'classical', century: 19 });
  });
});
describe('fieldSetterSync(propName)', () => {
  it('should set scalar value', () => {
    const store = getTestStore({ genre: 'classical', century: 16 });
    const setCentury = fieldSetterSync('century').bind(store);
    setCentury(17);
    expect(store.getState()).toEqual({ genre: 'classical', century: 17 });
  });
  it('should set with callback', () => {
    const store = getTestStore({ genre: 'classical', century: 18 });
    const setCentury = fieldSetterSync('century').bind(store);
    setCentury(old => old + 1);
    expect(store.getState()).toEqual({ genre: 'classical', century: 19 });
  });
});
describe('fieldSetterInput(propName)', () => {
  it('should set scalar value', () => {
    const store = getTestStore({ genre: 'classical', century: 16 });
    const setCentury = fieldSetterInput('century').bind(store);
    setCentury({ target: { value: 17 } });
    expect(store.getState()).toEqual({ genre: 'classical', century: 17 });
  });
});
