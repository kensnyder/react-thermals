import {
  fieldSetter,
  fieldListSetter,
  fieldToggler,
  fieldAdder,
  fieldAppender,
  fieldRemover,
  fieldMapper,
} from './createSetter.js';
import createStore from '../createStore/createStore.js';

describe('The createSetter function', () => {
  function getStore(initialState) {
    return createStore({ state: initialState });
  }
  describe('fieldSetter()', () => {
    it('should set scalar value', async () => {
      const store = getStore({ genre: 'classical', century: 16 });
      const setCentury = fieldSetter('century').bind(store);
      setCentury(17);
      await new Promise(r => setTimeout(r, 150));
      expect(store.getState()).toEqual({ genre: 'classical', century: 17 });
    });
    it('should set with callback', async () => {
      const store = getStore({ genre: 'classical', century: 18 });
      const setCentury = fieldSetter('century').bind(store);
      setCentury(old => old + 1);
      await new Promise(r => setTimeout(r, 15));
      expect(store.getState()).toEqual({ genre: 'classical', century: 19 });
    });
  });
  describe('fieldListSetter()', () => {
    it('should set scalar value', async () => {
      const store = getStore({ title: 'Mr', fname: 'John', lname: 'Doe' });
      const updateName = fieldListSetter(['fname', 'lname']).bind(store);
      updateName('Jason', 'Data');
      await new Promise(r => setTimeout(r, 15));
      expect(store.getState()).toEqual({
        title: 'Mr',
        fname: 'Jason',
        lname: 'Data',
      });
    });
  });
  describe('fieldToggler()', () => {
    it('should set scalar value', async () => {
      const store = getStore({ door: 'A', open: false });
      const toggleDoor = fieldToggler('open').bind(store);
      toggleDoor();
      await new Promise(r => setTimeout(r, 15));
      expect(store.getState()).toEqual({ door: 'A', open: true });
      toggleDoor();
      await new Promise(r => setTimeout(r, 15));
      expect(store.getState()).toEqual({ door: 'A', open: false });
    });
  });
  describe('fieldAdder()', () => {
    it('should increment', async () => {
      const store = getStore({ likes: 0, mode: 'view' });
      const like = fieldAdder('likes', 1).bind(store);
      const dislike = fieldAdder('likes', -1).bind(store);
      like();
      await new Promise(r => setTimeout(r, 15));
      expect(store.getState()).toEqual({ likes: 1, mode: 'view' });
      dislike();
      await new Promise(r => setTimeout(r, 15));
      expect(store.getState()).toEqual({ likes: 0, mode: 'view' });
    });
  });
  describe('fieldAppender()', () => {
    it('should append one or more args', async () => {
      const store = getStore({ vowels: [] });
      const addVowel = fieldAppender('vowels').bind(store);
      addVowel('a');
      await new Promise(r => setTimeout(r, 15));
      expect(store.getState()).toEqual({ vowels: ['a'] });
      addVowel('b', 'c');
      await new Promise(r => setTimeout(r, 15));
      expect(store.getState()).toEqual({ vowels: ['a', 'b', 'c'] });
    });
  });
  describe('fieldRemover()', () => {
    it('should remove one or more args', async () => {
      const store = getStore({ ids: [1, 2, 3, 4] });
      const removeId = fieldRemover('ids').bind(store);
      removeId(2);
      await new Promise(r => setTimeout(r, 15));
      expect(store.getState()).toEqual({ ids: [1, 3, 4] });
      removeId(3, 4);
      await new Promise(r => setTimeout(r, 15));
      expect(store.getState()).toEqual({ ids: [1] });
    });
  });
  describe('fieldMapper()', () => {
    it('should map values', async () => {
      const store = getStore({ ints: [5, 10, 15] });
      const mapInts = fieldMapper('ints').bind(store);
      mapInts(n => n * 2);
      await new Promise(r => setTimeout(r, 15));
      expect(store.getState()).toEqual({ ints: [10, 20, 30] });
    });
  });
});
