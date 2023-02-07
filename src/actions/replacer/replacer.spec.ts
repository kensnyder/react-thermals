import Store from '../../classes/Store/Store';
import { replacer, replacerSync } from './replacer';

describe('replacer()', () => {
  it('should update a single item with an updater', async () => {
    const players = [
      { name: 'Michael Jordan', jersey: '23' },
      { name: 'Steve Nash', jersey: '13' },
    ];
    const store = new Store({ players });
    const substitutePlayer = store.connect(replacer('players'));
    substitutePlayer(players[0], {
      name: 'Kobe Bryant',
      jersey: '24',
    });
    await store.nextState();
    expect(store.getState().players).toEqual([
      { name: 'Kobe Bryant', jersey: '24' },
      { name: 'Steve Nash', jersey: '13' },
    ]);
    substitutePlayer({}, { name: 'Carmelo Anthony', jersey: '00' });
    expect(store.getState().players).toEqual([
      { name: 'Kobe Bryant', jersey: '24' },
      { name: 'Steve Nash', jersey: '13' },
    ]);
  });
  it('should receive Promises', async () => {
    const favorites = [3, 17, 28, 45];
    const store = new Store({ favorites });
    const changeFavorite = store.connect(replacer('favorites'));
    changeFavorite(3, 4);
    await store.nextState();
    expect(store.getState().favorites).toEqual([4, 17, 28, 45]);
  });
  it('should receive functions', async () => {
    const favorites = ['Pumpkin Pie', 'Brownies', 'Donuts'];
    const store = new Store({ favorites });
    const changeFavorite = store.connect(replacer('favorites'));
    changeFavorite('Pumpkin Pie', () => 'Sheet Cake');
    await store.nextState();
    expect(store.getState().favorites).toEqual([
      'Sheet Cake',
      'Brownies',
      'Donuts',
    ]);
  });
  it('should receive functions that return promises', async () => {
    const favorites = ['Pumpkin Pie', 'Brownies', 'Donuts'];
    const store = new Store({ favorites });
    const changeFavorite = store.connect(replacer('favorites'));
    changeFavorite('Pumpkin Pie', old => Promise.resolve(old + ' x2'));
    await store.nextState();
    expect(store.getState().favorites).toEqual([
      'Pumpkin Pie x2',
      'Brownies',
      'Donuts',
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
      team: {
        players,
      },
    });
    const substitutePlayer = store.connect(replacerSync('team.players'));
    substitutePlayer(players[0], {
      name: 'Kobe Bryant',
      jersey: '24',
    });
    expect(store.getState().team.players).toEqual([
      { name: 'Kobe Bryant', jersey: '24' },
      { name: 'Steve Nash', jersey: '13' },
    ]);
  });
});
