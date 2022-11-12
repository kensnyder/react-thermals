import Store from '../../Store/Store';
import { replacer, replacerSync } from './replacer';

describe('replacer()', () => {
  it('should update a single item with an updater', async () => {
    const players = [
      { name: 'Michael Jordan', jersey: '23' },
      { name: 'Steve Nash', jersey: '13' },
    ];
    const store = new Store({
      state: {
        players,
      },
      actions: {
        substitutePlayer: replacer('players'),
      },
    });
    store.actions.substitutePlayer(players[0], {
      name: 'Kobe Bryant',
      jersey: '24',
    });
    await new Promise(r => setTimeout(r, 15));
    expect(store.getState().players).toEqual([
      { name: 'Kobe Bryant', jersey: '24' },
      { name: 'Steve Nash', jersey: '13' },
    ]);
  });
});

describe('replacerSync()', () => {
  it('should update a single item with an updater', () => {
    const players = [
      { name: 'Michael Jordan', jersey: '23' },
      { name: 'Steve Nash', jersey: '13' },
    ];
    const store = new Store({
      state: {
        team: {
          players,
        },
      },
      actions: {
        substitutePlayer: replacerSync('team.players'),
      },
    });
    store.actions.substitutePlayer(players[0], {
      name: 'Kobe Bryant',
      jersey: '24',
    });
    expect(store.getState().team.players).toEqual([
      { name: 'Kobe Bryant', jersey: '24' },
      { name: 'Steve Nash', jersey: '13' },
    ]);
  });
});
