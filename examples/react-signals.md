# React Signals

`react-thermals` ships a fine-grained reactivity system inspired by the
[TC39 Signals proposal](https://github.com/tc39/proposal-signals). Unlike
store-based state, signals let you sprinkle reactive values anywhere in your
codebase and bind them directly into JSX — no context providers, no hooks
wiring, no selector boilerplate.

Six exports cover everything:

| Export            | Purpose                                                             |
|-------------------|---------------------------------------------------------------------|
| `createSignal`    | Create a reactive value you can read, write, and render             |
| `createComputed`  | Create a derived signal that stays in sync automatically            |
| `effect`          | Run a callback whenever its signal reads change; supports teardown  |
| `untrack`         | Read signals inside an effect without subscribing                   |
| `batch`           | Commit multiple signal writes atomically                            |
| `useSignalValue`  | React hook that subscribes a component to a signal's current value  |

---

## createSignal

`createSignal<T>(defaultValue)` returns a `Signal<T>` object with five members:

- **`.get()`** – returns the current value and registers the signal as a
  dependency of the surrounding `effect` or `createComputed`
- **`.peek()`** – returns the current value *without* registering a dependency
  (shorthand for `untrack(() => signal.get())`)
- **`.set(value | updater)`** – updates the value (accepts a plain value or a
  function of the previous value)
- **`.Value`** – a zero-prop React component that renders the current value and
  re-renders automatically when it changes
- **`.store`** – the underlying `Store<T>` instance (gives access to events,
  `nextState()`, etc.)

### Counter

The simplest signal use-case. The `Value` component re-renders in-place without
touching any parent component.

```tsx
// signals/counter.ts
import { createSignal } from 'react-thermals';

export const count = createSignal(0);
export const increment = () => count.set(n => n + 1);
export const decrement = () => count.set(n => n - 1);
export const reset     = () => count.set(0);
```

```tsx
// components/Counter.tsx
import { count, increment, decrement, reset } from '../signals/counter';

export default function Counter() {
  return (
    <div>
      <button onClick={decrement}>−</button>
      {/* Only this text node re-renders, not the whole component */}
      <count.Value />
      <button onClick={increment}>+</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### Lazy initializer

Pass a function to defer initialization until the first call (same as
`useState(() => ...)`):

```tsx
import { createSignal } from 'react-thermals';

// Parsed once; not re-evaluated on every render
const theme = createSignal<'light' | 'dark'>(() => {
  return (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light';
});

export const toggleTheme = () =>
  theme.set(t => (t === 'light' ? 'dark' : 'light'));
```

### Functional updater chaining

`set` with a function receives the latest value, so you can chain calls safely:

```tsx
const items = createSignal<string[]>([]);

// Each updater sees the result of the previous one
items.set(list => [...list, 'apple']);
items.set(list => [...list, 'banana']);
// items.get() === ['apple', 'banana']
```

---

## createComputed

`createComputed<T>(compute, options?)` derives a new signal whose value is
recalculated whenever any signal read inside `compute` changes. It returns a
`ComputedSignal<T>` — the same shape as `Signal<T>` but without `set` (computed
values are read-only externally) and with one extra member:

- **`dispose()`** – stops tracking dependencies and prevents any further
  recomputation. Call this when a computed created inside a component or
  dynamic scope is no longer needed.

You can nest computeds, render them with `.Value`, or pass them to `effect`.

The optional `equals` comparator (default: `Object.is`) prevents downstream
updates when the computed value hasn't meaningfully changed.

### Shopping cart totals

```tsx
// signals/cart.ts
import { createSignal, createComputed } from 'react-thermals';

type LineItem = { id: string; name: string; qty: number; price: number };

export const cartItems  = createSignal<LineItem[]>([]);
export const couponPct  = createSignal(0);   // 0-100

export const itemCount = createComputed(() =>
  cartItems.get().reduce((sum, item) => sum + item.qty, 0)
);

export const subtotal = createComputed(() =>
  cartItems.get().reduce((sum, item) => sum + item.qty * item.price, 0)
);

export const total = createComputed(() =>
  subtotal.get() * (1 - couponPct.get() / 100)
);

export function addItem(item: LineItem) {
  cartItems.set(list => {
    const existing = list.find(i => i.id === item.id);
    if (existing) {
      return list.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
    }
    return [...list, item];
  });
}

export function removeItem(id: string) {
  cartItems.set(list => list.filter(i => i.id !== id));
}

export function applyCoupon(pct: number) {
  couponPct.set(Math.min(100, Math.max(0, pct)));
}
```

```tsx
// components/CartSummary.tsx
import { itemCount, subtotal, total } from '../signals/cart';

export default function CartSummary() {
  return (
    <aside>
      <p><itemCount.Value /> items in cart</p>
      <p>Subtotal: $<subtotal.Value /></p>
      <p>Total after discount: $<total.Value /></p>
    </aside>
  );
}
```

### Form validation

Validate derived from the raw field signals. The error signals only propagate
when the message text actually changes (Object.is comparison on strings).

```tsx
// signals/registrationForm.ts
import { createSignal, createComputed } from 'react-thermals';

export const username = createSignal('');
export const password = createSignal('');
export const confirm  = createSignal('');

export const usernameError = createComputed(() => {
  const v = username.get().trim();
  if (!v) return 'Username is required';
  if (v.length < 3) return 'At least 3 characters';
  return '';
});

export const passwordError = createComputed(() => {
  const v = password.get();
  if (!v) return 'Password is required';
  if (v.length < 8) return 'At least 8 characters';
  if (!/[A-Z]/.test(v)) return 'Needs an uppercase letter';
  return '';
});

export const confirmError = createComputed(() =>
  confirm.get() !== password.get() ? 'Passwords do not match' : ''
);

export const isValid = createComputed(
  () => !usernameError.get() && !passwordError.get() && !confirmError.get()
);
```

```tsx
// components/RegistrationForm.tsx
import {
  username, password, confirm,
  usernameError, passwordError, confirmError, isValid,
} from '../signals/registrationForm';

function Field({
  label,
  signal,
  errorSignal,
  type = 'text',
}: {
  label: string;
  signal: { get: () => string; set: (v: string) => void };
  errorSignal: { Value: React.FC };
  type?: string;
}) {
  return (
    <label>
      {label}
      <input
        type={type}
        value={signal.get()}
        onChange={e => signal.set(e.target.value)}
      />
      <span className="error"><errorSignal.Value /></span>
    </label>
  );
}

export default function RegistrationForm() {
  return (
    <form onSubmit={e => e.preventDefault()}>
      <Field label="Username" signal={username} errorSignal={usernameError} />
      <Field label="Password" signal={password} errorSignal={passwordError} type="password" />
      <Field label="Confirm"  signal={confirm}  errorSignal={confirmError}  type="password" />
      <button type="submit" disabled={!isValid.get()}>Register</button>
    </form>
  );
}
```

### Custom equality: avoid re-rendering for insignificant changes

A geo-position computed that only propagates when the user moves more than 10 m:

```tsx
import { createSignal, createComputed } from 'react-thermals';

type LatLng = { lat: number; lng: number };

const rawPosition = createSignal<LatLng>({ lat: 0, lng: 0 });

function metersApart(a: LatLng, b: LatLng) {
  const R = 6_371_000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

// Only push downstream updates when the rider has actually moved 10+ metres
export const significantPosition = createComputed(
  () => rawPosition.get(),
  { equals: (a, b) => metersApart(a, b) < 10 }
);

navigator.geolocation.watchPosition(pos => {
  rawPosition.set({ lat: pos.coords.latitude, lng: pos.coords.longitude });
});
```

### Chained computed signals

Computeds can depend on other computeds. The dependency graph is tracked
automatically.

```tsx
import { createSignal, createComputed } from 'react-thermals';

const celsius    = createSignal(0);
const fahrenheit = createComputed(() => celsius.get() * 9 / 5 + 32);
const label      = createComputed(() => {
  const f = fahrenheit.get();
  if (f < 32)  return 'Freezing';
  if (f < 50)  return 'Cold';
  if (f < 68)  return 'Cool';
  if (f < 86)  return 'Warm';
  return 'Hot';
});

// All three stay in sync:
celsius.set(100);
// fahrenheit.get() === 212
// label.get()      === 'Hot'
```

### Disposing a computed when it's no longer needed

`dispose()` stops the computed from tracking its dependencies. Use it when a
computed is created dynamically — inside a list item, a modal, or a route — and
should stop updating once that scope is torn down.

```tsx
import { useEffect } from 'react';
import { createSignal, createComputed } from 'react-thermals';

const items = createSignal<string[]>([]);

export default function ItemStats({ filter }: { filter: string }) {
  // This computed is created fresh for each filter value.
  const matched = createComputed(() =>
    items.get().filter(i => i.includes(filter))
  );

  useEffect(() => {
    // Stop tracking when the component unmounts or filter changes.
    return () => matched.dispose();
  }, [filter]);

  return <p><matched.Value /> items match</p>;
}
```

---

## effect

`effect(callback)` runs `callback` immediately and again whenever any signal
read inside it changes. It returns a dispose function that unsubscribes all
listeners.

The callback itself may also return a **teardown function**. That teardown is
called before each re-run and again when the effect is disposed — the same
contract as `useEffect`. Use it to cancel in-flight requests, clear timers, or
remove event listeners set up during the previous run.

Use `effect` for side-effects that live outside of React's lifecycle: syncing to
localStorage, analytics, WebSocket payloads, non-React UI like canvas/D3, etc.

### Persist theme to localStorage

```tsx
// signals/theme.ts
import { createSignal, effect } from 'react-thermals';

export const theme = createSignal<'light' | 'dark'>(
  () => (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light'
);

// Runs immediately and on every theme change
effect(() => {
  const t = theme.get();
  localStorage.setItem('theme', t);
  document.documentElement.dataset.theme = t;
});

export const toggleTheme = () => theme.set(t => (t === 'light' ? 'dark' : 'light'));
```

### Sync cart to the server

Post a debounced update whenever the cart changes, without touching any React
component:

```tsx
// signals/cartSync.ts
import { effect } from 'react-thermals';
import { cartItems } from './cart';

let timer: ReturnType<typeof setTimeout>;

effect(() => {
  const items = cartItems.get();   // tracked dependency

  clearTimeout(timer);
  timer = setTimeout(() => {
    fetch('/api/cart', {
      method: 'PUT',
      body: JSON.stringify(items),
      headers: { 'Content-Type': 'application/json' },
    });
  }, 500);
});
```

### Teardown: cancel the previous run before the next one

The callback can return a teardown function. Here an `AbortController` is
created each run and aborted before the next fetch starts, preventing stale
responses from landing:

```tsx
// signals/search.ts
import { createSignal, effect } from 'react-thermals';

export const query = createSignal('');
export const results = createSignal<string[]>([]);

effect(() => {
  const q = query.get();
  if (!q) {
    results.set([]);
    return;
  }

  const controller = new AbortController();

  fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
    .then(r => r.json())
    .then(data => results.set(data))
    .catch(() => {}); // AbortError is expected on teardown

  // Called automatically before the next run
  return () => controller.abort();
});
```

### Dynamic analytics

Track which page and which user is active. Both signals are dependencies, so
the effect re-fires when either changes.

```tsx
// analytics.ts
import { effect } from 'react-thermals';
import { session } from './signals/session';
import { currentPage } from './signals/router';

effect(() => {
  const user = session.get();
  const page = currentPage.get();

  if (user) {
    window.analytics?.track('page_view', {
      userId: user.id,
      page,
      timestamp: Date.now(),
    });
  }
});
```

### Cleanup: conditional effects in React components

When you want a signal-driven effect that only lives for the lifetime of a
component, call `effect` inside `useEffect` and return its cleanup:

```tsx
import { useEffect } from 'react';
import { effect } from 'react-thermals';
import { selectedId } from '../signals/selection';

export default function DetailPanel() {
  useEffect(() => {
    // effect runs immediately and re-runs when selectedId changes
    return effect(() => {
      const id = selectedId.get();
      document.title = id ? `Item #${id}` : 'Nothing selected';
    });
    // The effect cleanup function IS the useEffect cleanup — no extra wiring
  }, []);

  return <div>...</div>;
}
```

### Dynamic dependency tracking

Effects re-subscribe on every run, so a branch change drops old dependencies
and picks up new ones automatically:

```tsx
import { createSignal, effect } from 'react-thermals';

const activeTab = createSignal<'posts' | 'comments'>('posts');
const postsFilter = createSignal('');
const commentsFilter = createSignal('');

effect(() => {
  const tab = activeTab.get();
  // Only one of these is subscribed at a time
  const query = tab === 'posts' ? postsFilter.get() : commentsFilter.get();
  console.log(`Fetching ${tab} matching "${query}"`);
});

// Changing commentsFilter while on 'posts' tab does NOT trigger the effect
commentsFilter.set('hello');   // silent
activeTab.set('comments');     // triggers; now subscribes to commentsFilter
commentsFilter.set('world');   // triggers again
```

---

## untrack

`untrack<T>(callback)` reads any signals inside `callback` without registering
them as dependencies of the surrounding `effect` or `createComputed`. Use it
when you need to sample a value at effect-run time but you don't want that
signal to be a trigger.

**Important:** you cannot call `signal.set()` inside `untrack` — doing so
throws `"Cannot set signal while frozen"`.

**Tip — single-signal shorthand:** every signal exposes `peek()`, which is
equivalent to `untrack(() => signal.get())` but more concise:

```ts
// these are identical:
const size = untrack(() => pageSize.get());
const size = pageSize.peek();
```

Use `peek()` when you only need to escape tracking for one signal. Use
`untrack(callback)` when the callback reads several signals that should all be
untracked.

### Read a config signal without subscribing to it

The effect should re-run when `searchQuery` changes, but not when `pageSize`
changes (page size is read as a one-time configuration each time the query fires):

```tsx
import { createSignal, effect, untrack } from 'react-thermals';

const searchQuery = createSignal('');
const pageSize    = createSignal(20);

effect(() => {
  const query = searchQuery.get(); // tracked: triggers re-run
  const size  = pageSize.peek();   // read but NOT tracked

  if (!query) return;
  fetch(`/api/search?q=${query}&limit=${size}`)
    .then(r => r.json())
    .then(results => console.log(results));
});
```

### Previous-value pattern

Record the old value without making `previousValue` a dependency:

```tsx
import { createSignal, effect, untrack } from 'react-thermals';

const score = createSignal(0);
const previousScore = createSignal(0);

effect(() => {
  const next = score.get();          // tracked
  const prev = previousScore.peek(); // not tracked — avoids loop

  if (next > prev) {
    console.log(`Score improved by ${next - prev}!`);
  }
  previousScore.set(next); // fine — set is allowed outside untrack
});
```

### Throttled effect with an untracked timestamp

Log activity at most once per second. Sampling `lastLoggedAt` without
subscribing prevents the effect from re-triggering itself:

```tsx
import { createSignal, effect, untrack } from 'react-thermals';

const userActivity = createSignal<string | null>(null);
const lastLoggedAt = createSignal(0);

effect(() => {
  const action = userActivity.get();  // tracked
  const last   = lastLoggedAt.peek(); // not tracked

  if (!action) return;
  if (Date.now() - last < 1_000) return; // throttle

  console.log('[activity]', action);
  lastLoggedAt.set(Date.now()); // safe: called outside untrack
});

// Simulate activity
userActivity.set('click');
```

---

## batch

`batch(fn)` defers all signal writes inside `fn` until it returns. Effects and
computeds only fire after every write has been committed, so they never observe
a partially-updated state. Nested `batch()` calls are supported — the flush
happens on the outermost exit.

> **Why it matters:** Without batching, two sequential `set()` calls schedule
> two separate `AfterUpdate` microtasks. An effect that reads both signals will
> run once per changed signal. `batch` collapses the commits so the first
> effect run already sees the fully-updated picture.

### Updating related signals together

```tsx
import { createSignal, createComputed, batch } from 'react-thermals';

export const firstName = createSignal('');
export const lastName  = createSignal('');
export const fullName  = createComputed(
  () => `${firstName.get()} ${lastName.get()}`.trim()
);

export function setName(first: string, last: string) {
  batch(() => {
    firstName.set(first);
    lastName.set(last);
  });
  // fullName recomputes once, after both writes are committed
}
```

### Reading pending values inside a batch

`get()` and `peek()` see the not-yet-committed values inside the batch, so
logic that reads a signal immediately after setting it works as expected:

```tsx
import { createSignal, batch } from 'react-thermals';

const price    = createSignal(10);
const quantity = createSignal(1);

batch(() => {
  price.set(25);
  quantity.set(3);
  console.log(price.get() * quantity.get()); // 75 — sees pending values
});
```

### Functional updaters chain correctly inside a batch

Each functional updater receives the value from the previous call, even within
the same batch:

```tsx
import { createSignal, batch } from 'react-thermals';

const count = createSignal(0);

batch(() => {
  count.set(n => n + 1); // pending: 1
  count.set(n => n + 1); // pending: 2
});

count.get(); // 2
```

### Resetting a form atomically

```tsx
import { createSignal, batch } from 'react-thermals';

export const username = createSignal('');
export const email    = createSignal('');
export const password = createSignal('');

export function resetForm() {
  batch(() => {
    username.set('');
    email.set('');
    password.set('');
  });
}
```

---

## useSignalValue

`useSignalValue<T>(signal)` is a React hook that subscribes the calling
component to a signal and returns its current value. The component re-renders
whenever the signal changes.

**When to prefer `useSignalValue` over `<signal.Value />`:**

|                                       | `<signal.Value />` | `useSignalValue`  |
|---------------------------------------|--------------------|-------------------|
| Renders a primitive inline            | ✓ (ideal)          | Works but verbose |
| Drives conditional rendering          | ✗                  | ✓                 |
| Accesses the value in component logic | ✗                  | ✓                 |
| Works with object-valued signals      | ✗                  | ✓                 |

### Conditional rendering based on a signal

```tsx
import { createSignal, useSignalValue } from 'react-thermals';

export const isLoggedIn = createSignal(false);

export default function NavBar() {
  const loggedIn = useSignalValue(isLoggedIn);

  return (
    <nav>
      {loggedIn ? (
        <button onClick={() => isLoggedIn.set(false)}>Log out</button>
      ) : (
        <a href="/login">Log in</a>
      )}
    </nav>
  );
}
```

### Driving component logic with an object signal

```tsx
import { createSignal, useSignalValue } from 'react-thermals';

type User = { id: string; name: string; role: 'admin' | 'user' };

export const currentUser = createSignal<User | null>(null);

export default function Dashboard() {
  const user = useSignalValue(currentUser);

  if (!user) return <p>Please log in.</p>;

  return (
    <main>
      <h1>Welcome, {user.name}</h1>
      {user.role === 'admin' && <AdminPanel />}
    </main>
  );
}
```

### Using both in the same component

`useSignalValue` and `<signal.Value />` complement each other. Use the hook
when you need the value for logic; use the component for inline text that
shouldn't force the whole parent to re-render:

```tsx
import { createSignal, createComputed, useSignalValue } from 'react-thermals';

export const items    = createSignal<string[]>([]);
export const itemCount = createComputed(() => items.get().length);

export default function Cart() {
  const count = useSignalValue(itemCount);

  // The entire Cart re-renders only when count changes (to show/hide empty state).
  if (count === 0) return <p>Your cart is empty.</p>;

  return (
    <section>
      <h2>Cart (<itemCount.Value /> items)</h2>
      {/* ... */}
    </section>
  );
}
```

---

## TypeScript types

```ts
import type {
  Signal,          // { get, peek, set, Value, store }
  ReadonlySignal,  // { get, peek, Value, store } — no set
  ComputedSignal,  // ReadonlySignal + { dispose }
  Getter,          // () => T
  Setter,          // (value | updater) => void
} from 'react-thermals';
```

`createSignal` returns `Signal<T>`. `createComputed` returns `ComputedSignal<T>`,
which extends `ReadonlySignal<T>` — the `set` method is intentionally absent to
prevent external mutation of derived values.

Use `ReadonlySignal<T>` when writing functions that accept either kind:

```ts
import type { ReadonlySignal } from 'react-thermals';

function logWhenChanged<T>(signal: ReadonlySignal<T>, label: string) {
  return effect(() => {
    console.log(`[${label}]`, signal.get());
  });
}
```

---

## SSR / Server-Side Rendering

When `window` is undefined (Node.js, Deno, edge runtimes) `createSignal`
returns a lightweight SSR-safe stub: `get()` returns the initial value, `set()`
is a no-op, and `Value` renders the initial value as a static string. No hooks,
no subscriptions, no side-effects.

This means you can import your signal modules in both server and client code
without special guards:

```tsx
// signals/locale.ts
import { createSignal } from 'react-thermals';

// On the server: returns 'en' and never updates
// On the client: fully reactive
export const locale = createSignal<string>(
  () => navigator?.language?.split('-')[0] ?? 'en'
);
```

```tsx
// pages/index.tsx (Next.js / Remix RSC)
import { locale } from '../signals/locale';

export default function Page() {
  // locale.get() is safe in an RSC or getServerSideProps context
  return <html lang={locale.get()}>...</html>;
}
```

---

## Putting it all together: real-time dashboard

A complete example combining all four primitives. Prices stream in via
WebSocket; computed signals derive formatted values; effects keep the browser
tab title up to date; `untrack` prevents the title effect from re-triggering
when the user changes notification preferences.

```tsx
// signals/dashboard.ts
import { createSignal, createComputed, effect, untrack } from 'react-thermals';

// --- raw signals ---
export const btcPrice     = createSignal(0);
export const ethPrice     = createSignal(0);
export const notifyOnDrop = createSignal(true);   // user preference

// --- computed ---
export const btcLabel = createComputed(() =>
  `BTC $${btcPrice.get().toLocaleString('en-US', { minimumFractionDigits: 2 })}`
);
export const ethLabel = createComputed(() =>
  `ETH $${ethPrice.get().toLocaleString('en-US', { minimumFractionDigits: 2 })}`
);
export const ratio = createComputed(() => {
  const eth = ethPrice.get();
  return eth === 0 ? 0 : btcPrice.get() / eth;
});

// --- effects ---

// Keep the tab title in sync; don't re-run just because notifyOnDrop changes
effect(() => {
  const btc = btcLabel.get();
  const eth = ethLabel.get();
  const shouldNotify = untrack(() => notifyOnDrop.get());
  document.title = `${btc} | ${eth}${shouldNotify ? ' 🔔' : ''}`;
});

// WebSocket feed
const ws = new WebSocket('wss://stream.example.com/prices');
ws.addEventListener('message', (e: MessageEvent) => {
  const { symbol, price } = JSON.parse(e.data);
  if (symbol === 'BTC') btcPrice.set(price);
  if (symbol === 'ETH') ethPrice.set(price);
});
```

```tsx
// components/Dashboard.tsx
import { btcLabel, ethLabel, ratio, notifyOnDrop } from '../signals/dashboard';
import { useSignalValue } from "./reactSignals";

export default function Dashboard() {
  const hasDropNotification = useSignalValue(notifyOnDrop);
  return (
    <main>
      <h1>Crypto Prices</h1>
      <p>
        <btcLabel.Value />
      </p>
      <p>
        <ethLabel.Value />
      </p>
      <p>BTC/ETH ratio: <ratio.Value /></p>
      <label>
        <input
          type="checkbox"
          checked={hasDropNotification}
          onChange={e => notifyOnDrop.set(e.target.checked)}
        />
        Notify on price drop
      </label>
    </main>
  );
}
```

---

## Signals with object values

When your signal holds a complex object, you can use `createComputed` to derive
individual fields from it. Each computed becomes its own reactive leaf — only
the component that mounts `<computed.Value />` re-renders when that specific
derived value changes, not any parent component.

Here a single `session` signal drives three computed signals: `displayName`,
`displayEmail`, and `initials`. A single `session.set(...)` updates all three
in one pass with no redundant renders.

```ts
// signals/session.ts
import { createSignal, createComputed } from 'react-thermals';

type Session = { name: string; email: string } | null;

export const session = createSignal<Session>(null);

export const displayName = createComputed(() =>
  session.get()?.name ?? 'Guest User'
);

export const displayEmail = createComputed(() =>
  session.get()?.email ?? 'guest@example.com'
);

export const initials = createComputed(() => {
  const name = session.get()?.name ?? 'GU';
  return name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .join('');
});
```

```tsx
// components/UserHeader.tsx
import { session, displayName, displayEmail, initials } from '../signals/session';

export default function UserHeader() {
  return (
    <header>
      <div className="avatar"><initials.Value /></div>
      <span className="name"><displayName.Value /></span>
      <span className="email"><displayEmail.Value /></span>
    </header>
  );
}
```

To update the session — for example after a login API call — set the whole
object at once:

```ts
session.set({ name: 'Jane Doe', email: 'jane@example.com' });
// initials     → 'JD'
// displayName  → 'Jane Doe'
// displayEmail → 'jane@example.com'

session.set(null);
// all three computed signals update to ''
```
