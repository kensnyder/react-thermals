import Store from '../../classes/Store/Store';
import appender from './appender';

type VowelType = 'a' | 'e' | 'i' | 'o' | 'u';

describe('appender(propName)', () => {
  it('should append one or more args', async () => {
    const store = new Store({ vowels: [] });
    const addVowel = store.connect('vowels', appender<VowelType>());
    addVowel('a');
    await store.nextState();
    expect(store.getState()).toEqual({ vowels: ['a'] });
    addVowel('e', 'i');
    await store.nextState();
    expect(store.getState()).toEqual({ vowels: ['a', 'e', 'i'] });
  });
  it('should append one or more args with path', () => {
    const store = new Store({ spec: { vowels: [] } });
    const addVowel = store.connect('spec.vowels', appender<VowelType>());
    addVowel('a');
    expect(store.getState()).toEqual({ spec: { vowels: ['a'] } });
    addVowel('e', 'i');
    expect(store.getState()).toEqual({ spec: { vowels: ['a', 'e', 'i'] } });
  });
  it('should do nothing if target is not an array', () => {
    const store = new Store({ spec: { vowels: null } });
    const addVowel = store.connect('spec.vowels', appender<VowelType>());
    addVowel('a');
    expect(store.getState()).toEqual({ spec: { vowels: null } });
  });
  it('should do nothing if target does not exist', () => {
    const store = new Store({ spec: null });
    const addVowel = store.connect('spec.vowels', appender<VowelType>());
    addVowel('a');
    expect(store.getState()).toEqual({ spec: null });
  });
});
