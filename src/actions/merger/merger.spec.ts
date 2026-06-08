import { describe, expect, it } from 'bun:test';
import Store from '../../classes/Store/Store';
import merger from './merger';

describe('merger(path)', () => {
  it('should merge state', async () => {
    const store = new Store<{ door: string; open: boolean; color?: string; finish?: string }>({ door: 'A', open: false });
    const addPaint = store.connect('@', merger());
    addPaint({ color: 'red', finish: 'matte' });
    await store.nextState();
    expect(store.getState()).toEqual({
      door: 'A',
      open: false,
      color: 'red',
      finish: 'matte',
    });
  });
  it('should merge state at path', async () => {
    type DoorType = { door: string; open: boolean; color?: string; finish?: string };
    const store = new Store({ doors: [{ door: 'A', open: false }] as DoorType[] });
    const addPaint = store.connect('doors[0]', merger<DoorType>());
    addPaint({ color: 'blue', finish: 'gloss', open: true });
    await store.nextState();
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
