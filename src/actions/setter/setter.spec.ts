import Store from '../../classes/Store/Store';
import { setter, setterInput, setterFn } from './setter';

describe('setter()', () => {
  it('should set scalar value', async () => {
    const store = new Store({ genre: 'classical', century: 16 });
    const setCentury = store.connect('century', setter());
    setCentury(17);
    const final = await store.nextState();
    expect(final).toEqual({ genre: 'classical', century: 17 });
  });
  it('should set with function', async () => {
    const store = new Store({ genre: 'classical', century: 18 });
    const nextCentury = store.connect(
      'century',
      setterFn(old => old + 1)
    );
    nextCentury();
    const final = await store.nextState();
    expect(final).toEqual({ genre: 'classical', century: 19 });
  });
});
describe('setterInput()', () => {
  it('should set scalar value', async () => {
    const store = new Store({ genre: 'classica' });
    const setCenturyOnChange = store.connect('genre', setterInput());
    setCenturyOnChange({ target: { value: 'classical' } });
    const final = await store.nextState();
    expect(final).toEqual({ genre: 'classical' });
  });
});
