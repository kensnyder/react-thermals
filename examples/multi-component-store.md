# Example: A store used by multiple components

In src/stores/cartStore.js we define a single store that is only used by the
parts of the application that deal with a shopping cart.

```js
import {
  Store,
  useStoreSelector,
  appender,
  remover,
  setter,
  composeActions,
} from 'react-thermals';

const store = new Store({
  items: [],
  discount: 0,
});

export const addToCart = store.connect(
  composeActions([
    appender('items'),
    newItem => {
      axios.post('/api/v1/carts/item', newItem);
    },
  ])
);

export const removeFromCart = store.connect(
  composeActions([
    remover('items'),
    oldItem => {
      axios.delete(`/api/v1/carts/items/${oldItem.id}`);
    },
  ])
);

export const setDiscount = store.connect('discount', setter());

export function useCartItems() {
  return useStoreSelector(store, 'items');
}

export function useCartItemCount() {
  return useStoreSelector(store, state => state.items.length);
}

export function useCartTotal() {
  return useStoreSelector(store, state => {
    let total = 0;
    state.items.forEach(item => {
      total += item.quantity * item.price * (1 - state.discount);
    });
    return total;
  });
}
```

In components/Header.jsx we may want to show how many items are in the cart

```js
import React from 'react';
import { useCartItemCount } from '../stores/cartStore';

export default function Header() {
  // only re-render when cart item count changes
  const itemCount = useCartItemCount();
  return (
    <header>
      <h1>My App</h1>
      <a href="/cart">
        Shopping Cart: {itemCount} {itemCount === 1 ? 'item' : 'items'}
      </a>
    </header>
  );
}
```

In components/CartDetails.jsx we need the items, the total, and a way to remove
an item from the cart.

```js
import React from 'react';
import {
  useCartItems,
  useCartTotal,
  removeFromCart,
} from '../stores/cartStore';

export default function CartDetails() {
  // only re-render when list or total changes
  const items = useCartItems();
  const total = useCartTotal();
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>
          {item.name}: ${item.price.toFixed(2)}{' '}
          <button onClick={() => removeFromCart(item)}>Delete</button>
        </li>
      ))}
      <li>Total: ${total.toFixed(2)}</li>
    </ul>
  );
}
```

In components/Product.jsx we don't need info about the cart, but we may need to
add an item to the cart.

```js
import React from 'react';
import { addToCart } from '../stores/cartStore';

export default function Product({ product }) {
  return (
    <div>
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <p>${product.price.toFixed(2)}</p>
      <button onClick={() => addToCart(product)}>Add to cart</button>
    </div>
  );
}
```

In stores/cartStore.spec.js we can test that actions change state in the correct
way and test any side effects like an http request.

```js
import axios from 'axios';
import { default as cartStore } from './cartStore';

jest.mock('axios');

describe('cartStore', () => {
  let store;
  beforeEach(() => {
    store = cartStore.clone();
  });
  it('should add item', async () => {
    const item = { id: 123, name: 'Pencil', price: 2.99 };
    store.actions.add(item);
    await store.nextState();
    expect(store.getState().items[0]).toBe(item);
    expect(axios.post).toHaveBeenCalledWith('/api/v1/carts/item', item);
  });
  it('should remove item', async () => {
    const item = { id: 123, name: 'Pencil', price: 2.99 };
    store.setStateAt('items', [item]);
    store.actions.remove(item);
    await store.nextState();
    expect(store.getState().items).toEqual([]);
    expect(axios.delete).toHaveBeenCalledWith(`/api/v1/carts/items/${item.id}`);
  });
});
```
