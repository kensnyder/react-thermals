import Store from '../../classes/Store/Store';
import replacer from './replacer';

describe('replacer()', () => {
  it('should update a single item with an updater', async () => {
    const players = [
      { name: 'Michael Jordan', jersey: '23' },
      { name: 'Steve Nash', jersey: '13' },
    ];
    const store = new Store({ players });
    const substitutePlayer = store.connect('players', replacer());
    substitutePlayer(players[0], {
      name: 'Kobe Bryant',
      jersey: '24',
    });
    await store.nextState();
    expect(store.getState().players).toEqual([
      { name: 'Kobe Bryant', jersey: '24' },
      { name: 'Steve Nash', jersey: '13' },
    ]);
    // Do nothing if itemToReplace is not found
    substitutePlayer({}, { name: 'Carmelo Anthony', jersey: '00' });
    expect(store.getState().players).toEqual([
      { name: 'Kobe Bryant', jersey: '24' },
      { name: 'Steve Nash', jersey: '13' },
    ]);
  });
  it('should receive functions', async () => {
    const favorites = ['Pumpkin Pie', 'Brownies', 'Donuts'];
    const store = new Store({ favorites });
    const changeFavorite = store.connect('favorites', replacer());
    changeFavorite('Pumpkin Pie', old => `Custard ${old}`);
    await store.nextState();
    expect(store.getState().favorites).toEqual([
      'Custard Pumpkin Pie',
      'Brownies',
      'Donuts',
    ]);
  });
});
