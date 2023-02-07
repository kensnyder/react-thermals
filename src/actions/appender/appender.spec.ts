import Store from '../../classes/Store/Store';
import appender from './appender';

describe('appender(propName)', () => {
  it('should append one or more args', async () => {
    const store = new Store({ vowels: [] });
    const addVowel = store.connect(appender('vowels'));
    addVowel('a');
    await store.nextState();
    expect(store.getState()).toEqual({ vowels: ['a'] });
    addVowel('e', 'i');
    await store.nextState();
    expect(store.getState()).toEqual({ vowels: ['a', 'e', 'i'] });
  });
  it('should append one or more args with path', () => {
    const store = new Store({ spec: { vowels: [] } });
    const addVowel = store.connect(appender('spec.vowels'));
    addVowel('a');
    expect(store.getState()).toEqual({ spec: { vowels: ['a'] } });
    addVowel('e', 'i');
    expect(store.getState()).toEqual({ spec: { vowels: ['a', 'e', 'i'] } });
  });
});
