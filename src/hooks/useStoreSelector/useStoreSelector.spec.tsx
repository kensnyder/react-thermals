import React, {
  FunctionComponent,
  MouseEventHandler,
  ReactElement,
  useState,
} from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Store from '../../classes/Store/Store';
import useStoreState from '../useStoreState/useStoreState';
import useStoreSelector from './useStoreSelector';

describe('useStoreSelector(mapState)', () => {
  // define store before each test
  let store: Store;
  let PlanetComponent: FunctionComponent;
  let RocketComponent: FunctionComponent;
  let TripComponent: FunctionComponent;
  let TripWithEqualityFnComponent: FunctionComponent;
  let renderCounts: Record<string, number>;
  let visit: Function;
  let upgradeRocket: Function;
  let pwn: Function;
  beforeEach(() => {
    type TransportState = {
      planet: string;
      rocket: number;
      seats: string[];
    };
    const state: TransportState = {
      planet: 'Jupiter',
      rocket: 12,
      seats: ['a', 'b', 'c'],
    };
    store = new Store(state);
    visit = (planet: string) => {
      store.mergeState({ planet });
    };
    upgradeRocket = () => {
      store.mergeState(old => ({ rocket: old.rocket + 1 }));
    };
    pwn = (to: any) => {
      store.setState(to);
    };
    renderCounts = {
      planet: 0,
      rocket: 0,
      trip: 0,
      trip2: 0,
    };
    PlanetComponent = () => {
      renderCounts.planet++;
      const planet = useStoreSelector(store, state => state.planet);
      return (
        <div className="Planet">
          <button onClick={() => visit('Mars')}>Visit Mars</button>
          <button onClick={() => visit('Saturn')}>Visit Saturn</button>
          <span title="planet">{planet}</span>
        </div>
      );
    };
    RocketComponent = () => {
      renderCounts.rocket++;
      const rocket = useStoreSelector(store, state => state.rocket);
      return (
        <div className="Rocket">
          <button onClick={upgradeRocket as MouseEventHandler}>
            Upgrade Rocket
          </button>
          <button
            onClick={() =>
              pwn({
                planet: 'Vulcan',
                rocket: 17,
                seats: ['x', 'y', 'z'],
              })
            }
          >
            Hack it
          </button>
          <span title="rocket">{rocket}</span>
        </div>
      );
    };
    TripComponent = () => {
      renderCounts.trip++;
      const state = useStoreState(store);
      return (
        <div className="Trip">
          <span title="trip on">{state.rocket}</span>
          <span title="trip to">{state.planet}</span>
        </div>
      );
    };
    TripWithEqualityFnComponent = () => {
      renderCounts.trip2++;
      const state = useStoreSelector(store, null, () => true);
      return (
        <div className="TripWithEqualityFnComponent">
          <span title="trip2 on">{state.rocket}</span>
          <span title="trip2 to">{state.planet}</span>
        </div>
      );
    };
  });
  it('should have initial state', () => {
    const { getByTitle } = render(<TripComponent />);
    expect(getByTitle('trip on')).toHaveTextContent('12');
    expect(getByTitle('trip to')).toHaveTextContent('Jupiter');
    expect(renderCounts.planet).toBe(0);
    expect(renderCounts.rocket).toBe(0);
    expect(renderCounts.trip).toBe(1);
  });
  it('should have initial state mapped', () => {
    const { getByTitle } = render(<PlanetComponent />);
    expect(getByTitle('planet')).toHaveTextContent('Jupiter');
    expect(renderCounts.planet).toBe(1);
    expect(renderCounts.rocket).toBe(0);
    expect(renderCounts.trip).toBe(0);
  });
  it('should rerender only selected components', async () => {
    const { getByText, getByTitle, findByText } = render(
      <>
        <PlanetComponent />
        <RocketComponent />
        <TripComponent />
        <TripWithEqualityFnComponent />
      </>
    );
    expect(renderCounts.planet).toBe(1);
    expect(renderCounts.rocket).toBe(1);
    expect(renderCounts.trip).toBe(1);
    expect(renderCounts.trip2).toBe(1);
    await act(() => {
      fireEvent.click(getByText('Visit Mars'));
    });
    expect(renderCounts.trip).toBe(2);
    expect(renderCounts.planet).toBe(2);
    expect(renderCounts.rocket).toBe(1);
    expect(renderCounts.trip2).toBe(1);
    expect(getByTitle('planet')).toHaveTextContent('Mars');
    expect(getByTitle('trip2 to')).toHaveTextContent('Jupiter');
  });
  it('should allow non-function updaters', async () => {
    const { getByText } = render(<RocketComponent />);
    await act(() => {
      fireEvent.click(getByText('Hack it'));
    });
    expect(store.getState()).toEqual({
      planet: 'Vulcan',
      rocket: 17,
      seats: ['x', 'y', 'z'],
    });
  });
  it('should allow overwrite part of initial state', () => {
    store.on('BeforeInitialize', () => {
      store.mergeState({ planet: 'Neptune' }, { bypassAll: true });
    });
    const { getByTitle } = render(<PlanetComponent />);
    expect(getByTitle('planet')).toHaveTextContent(/^Neptune$/);
  });
});

describe('store.on(type, handler)', () => {
  // define store before each test
  let store: Store;
  let TelescopeComponent: FunctionComponent;
  type ToggleableProps = {
    id: number;
    children: ReactElement;
  };
  let Toggleable: FunctionComponent<ToggleableProps>;
  let renderCounts: Record<string, number>;
  let pointAt: Function;
  let zoomIn: Function;
  let pwn: Function;
  let throwIt: Function;
  beforeEach(() => {
    type TelescopeState = {
      target: string;
      zoom: number;
      seats: string[];
    };
    const state: TelescopeState = {
      target: 'moon',
      zoom: 10,
      seats: ['a', 'b', 'c'],
    };
    store = new Store(state);
    pointAt = (target: string) => {
      store.mergeState({ target });
    };
    zoomIn = (factor: number) => {
      store.mergeState((old: TelescopeState) => ({
        zoom: old.zoom * factor,
      }));
    };
    pwn = (newState: TelescopeState) => {
      store.setState(newState);
    };
    throwIt = (message: string) => {
      store.setState(() => {
        return Promise.reject(message);
      });
    };
    renderCounts = {
      telescope: 0,
      toggle: 0,
    };
    TelescopeComponent = () => {
      renderCounts.telescope++;
      const state = useStoreState(store);
      return (
        <div className="Telescope">
          <button onClick={() => pointAt('Mars')}>Look at Mars</button>
          <button onClick={() => zoomIn(2)}>Zoom 2x</button>
          <span>current target={state.target}</span>
        </div>
      );
    };
    Toggleable = ({ id, children }: ToggleableProps) => {
      const [isVisible, setIsVisible] = useState(false);
      renderCounts.toggle++;
      return (
        <div className="Toggleable">
          <button onClick={() => setIsVisible(true)}>Show {id}</button>
          <button onClick={() => setIsVisible(false)}>Hide {id}</button>
          {isVisible && children}
        </div>
      );
    };
  });
  it('should allow modifying initial state', () => {
    store.on('BeforeInitialize', () => {
      store.mergeState({ target: 'Venus' }, { bypassAll: true });
    });
    const { getByText } = render(<TelescopeComponent />);
    expect(getByText('current target=Venus')).toBeInTheDocument();
  });
  it('should fire mount/unmount events properly', async () => {
    let afterFirstUse = false;
    let firstMountCount = 0;
    let mountCount = 0;
    let unmountCount = 0;
    let lastUnmountCount = 0;
    store.on('AfterFirstUse', () => (afterFirstUse = true));
    store.on('AfterFirstMount', () => firstMountCount++);
    store.on('AfterMount', () => mountCount++);
    store.on('AfterUnmount', () => unmountCount++);
    store.on('AfterLastUnmount', () => lastUnmountCount++);
    const { getByText } = render(
      <>
        <Toggleable id={1}>
          <TelescopeComponent />
        </Toggleable>
        <Toggleable id={2}>
          <TelescopeComponent />
        </Toggleable>
      </>
    );
    expect(afterFirstUse).toBe(false);
    expect(firstMountCount).toBe(0);
    expect(mountCount).toBe(0);
    expect(unmountCount).toBe(0);
    expect(lastUnmountCount).toBe(0);
    await act(() => {
      fireEvent.click(getByText('Show 1'));
    });
    expect(afterFirstUse).toBe(true);
    expect(firstMountCount).toBe(1);
    expect(mountCount).toBe(1);
    expect(unmountCount).toBe(0);
    expect(lastUnmountCount).toBe(0);
    await act(() => {
      fireEvent.click(getByText('Show 2'));
    });
    expect(afterFirstUse).toBe(true);
    expect(firstMountCount).toBe(1);
    expect(mountCount).toBe(2);
    expect(unmountCount).toBe(0);
    expect(lastUnmountCount).toBe(0);
    await act(() => {
      fireEvent.click(getByText('Hide 2'));
    });
    expect(afterFirstUse).toBe(true);
    expect(firstMountCount).toBe(1);
    expect(mountCount).toBe(2);
    expect(unmountCount).toBe(1);
    expect(lastUnmountCount).toBe(0);
    await act(() => {
      fireEvent.click(getByText('Hide 1'));
    });
    expect(afterFirstUse).toBe(true);
    expect(firstMountCount).toBe(1);
    expect(mountCount).toBe(2);
    expect(unmountCount).toBe(2);
    expect(lastUnmountCount).toBe(1);
  });
  it('should fire on setter exceptions', async () => {
    const { getByText } = render(
      <>
        <button onClick={() => throwIt('foobar')}>Throw</button>
        <TelescopeComponent />
      </>
    );
    let rejection = null;
    store.on('SetterRejection', evt => (rejection = evt.data));
    await act(() => {
      fireEvent.click(getByText('Throw'));
    });
    await new Promise(r => setTimeout(r, 0));
    expect(rejection).toBe('foobar');
  });
  it('should return used count', async () => {
    render(
      <>
        <TelescopeComponent />
        <TelescopeComponent />
        <TelescopeComponent />
      </>
    );
    expect(store.getUsedCount()).toBe(3);
    expect(store.getMountCount()).toBe(3);
  });
});
