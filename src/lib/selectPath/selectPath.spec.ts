import selectPath from './selectPath';

describe('selectPath()', () => {
  it('should accept property names', () => {
    const selector = selectPath('phone');
    const slice = selector({ phone: '867-5309' });
    expect(slice).toEqual('867-5309');
  });
  it('should accept @ for identity', () => {
    const selector = selectPath('@');
    const slice = selector({ phone: '867-5309' });
    expect(slice).toEqual({ phone: '867-5309' });
  });
  it('should accept strings with dots', () => {
    const selector = selectPath('user.phone');
    const slice = selector({ user: { phone: '867-5309' } });
    expect(slice).toEqual('867-5309');
  });
  it('should return undefined for non-existent paths', () => {
    const selector = selectPath('user.phone');
    const slice = selector({});
    expect(slice).toEqual(undefined);
  });
  it('should return star paths', () => {
    const selector = selectPath('users[*].phone');
    const slice = selector({
      users: [{ phone: '867-5309' }, { phone: '555-5555' }],
    });
    expect(slice).toEqual(['867-5309', '555-5555']);
  });
  it('should return double star paths as flattened array', () => {
    const selector = selectPath('books[*].authors[*].id');
    const slice = selector({
      books: [
        {
          title: 'JavaScript ABCs',
          authors: [
            { name: 'John A', id: 101 },
            { name: 'Kyle B', id: 102 },
          ],
        },
        {
          title: 'Web Tech Rocks',
          authors: [{ name: 'Owen C', id: 105 }],
        },
      ],
    });
    expect(slice).toEqual([101, 102, 105]);
  });
  it('should handle star as last segment', () => {
    const selector = selectPath('books[*]');
    const slice = selector({
      books: [
        {
          title: 'JavaScript ABCs',
        },
        {
          title: 'Web Tech Rocks',
        },
      ],
    });
    expect(slice).toEqual([
      {
        title: 'JavaScript ABCs',
      },
      {
        title: 'Web Tech Rocks',
      },
    ]);
  });
});
