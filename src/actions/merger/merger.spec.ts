import Store from '../../classes/Store/Store';
import merger from './merger';

describe('merger(path)', () => {
  it('should merge state', async () => {
    const store = new Store({ door: 'A', open: false });
    const addPaint = merger('@').bind(store);
    addPaint({ color: 'red', finish: 'matte' });
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({
      door: 'A',
      open: false,
      color: 'red',
      finish: 'matte',
    });
  });
  it('should merge state at path', async () => {
    const store = new Store({ doors: [{ door: 'A', open: false }] });
    const addPaint = merger('doors[0]').bind(store);
    addPaint({ color: 'blue', finish: 'gloss', open: true });
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState()).toEqual({
      doors: [
        {
          door: 'A',
          open: true,
          color: 'blue',
          finish: 'gloss',
        },
      ],
    });
  });
});
