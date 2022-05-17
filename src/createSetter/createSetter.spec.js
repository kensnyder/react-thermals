import {
  fieldSetter,
  fieldListSetter,
  fieldToggler,
  fieldAdder,
  fieldAppender,
  fieldRemover,
  fieldMapper,
} from './createSetter.js';

describe('The createSetter function', () => {
  let state;
  const ctx = {
    async mergeState(fn) {
      let updated = await fn(state);
      state = { ...state, ...updated };
    },
  };

  describe('fieldSetter()', () => {
    it('should set scalar value', async () => {
      state = { genre: 'classical', century: 16 };
      const setCentury = fieldSetter('century').bind(ctx);
      setCentury(17);
      await new Promise(r => setTimeout(r, 15));
      expect(state).toEqual({ genre: 'classical', century: 17 });
    });
    it('should set with callback', async () => {
      state = { genre: 'classical', century: 18 };
      const setCentury = fieldSetter('century').bind(ctx);
      setCentury(old => old + 1);
      await new Promise(r => setTimeout(r, 15));
      expect(state).toEqual({ genre: 'classical', century: 19 });
    });
    it('should set with async callback', async () => {
      state = { genre: 'classical', century: 20 };
      const setCentury = fieldSetter('century').bind(ctx);
      setCentury(async old => old + 1);
      await new Promise(r => setTimeout(r, 15));
      expect(state).toEqual({ genre: 'classical', century: 21 });
    });
  });
  describe('fieldListSetter()', () => {
    it('should set scalar value', async () => {
      state = { title: 'Mr', fname: 'John', lname: 'Doe' };
      const updateName = fieldListSetter(['fname', 'lname']).bind(ctx);
      updateName('Jason', 'Data');
      await new Promise(r => setTimeout(r, 15));
      expect(state).toEqual({ title: 'Mr', fname: 'Jason', lname: 'Data' });
    });
  });
  describe('fieldToggler()', () => {
    it('should set scalar value', async () => {
      state = { door: 'A', open: false };
      const toggleDoor = fieldToggler('open').bind(ctx);
      toggleDoor();
      await new Promise(r => setTimeout(r, 15));
      expect(state).toEqual({ door: 'A', open: true });
      toggleDoor();
      await new Promise(r => setTimeout(r, 15));
      expect(state).toEqual({ door: 'A', open: false });
    });
  });
  describe('fieldAdder()', () => {
    it('should increment', async () => {
      state = { likes: 0, mode: 'view' };
      const like = fieldAdder('likes', 1).bind(ctx);
      const dislike = fieldAdder('likes', -1).bind(ctx);
      like();
      await new Promise(r => setTimeout(r, 15));
      expect(state).toEqual({ likes: 1, mode: 'view' });
      dislike();
      await new Promise(r => setTimeout(r, 15));
      expect(state).toEqual({ likes: 0, mode: 'view' });
    });
  });
  describe('fieldAppender()', () => {
    it('should append one or more args', async () => {
      state = { vowels: [] };
      const addVowel = fieldAppender('vowels').bind(ctx);
      addVowel('a');
      await new Promise(r => setTimeout(r, 15));
      expect(state).toEqual({ vowels: ['a'] });
      addVowel('b', 'c');
      await new Promise(r => setTimeout(r, 15));
      expect(state).toEqual({ vowels: ['a', 'b', 'c'] });
    });
  });
  describe('fieldRemover()', () => {
    it('should remove one or more args', async () => {
      state = { ids: [1, 2, 3, 4] };
      const removeId = fieldRemover('ids').bind(ctx);
      removeId(2);
      await new Promise(r => setTimeout(r, 15));
      expect(state).toEqual({ ids: [1, 3, 4] });
      removeId(3, 4);
      await new Promise(r => setTimeout(r, 15));
      expect(state).toEqual({ ids: [1] });
    });
  });
  describe('fieldMapper()', () => {
    it('should map values', async () => {
      state = { ints: [5, 10, 15] };
      const mapInts = fieldMapper('ints').bind(ctx);
      mapInts(n => n * 2);
      await new Promise(r => setTimeout(r, 15));
      expect(state).toEqual({ ints: [10, 20, 30] });
    });
  });
});
