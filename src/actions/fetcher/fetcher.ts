import Store from '../../classes/Store/Store';

/**
 * Helper function to send a fetch() request and add the response to the state
 * @param path  The name of or path that will accept { response, error }
 * @param url  The url to fetch data from
 * @param init  The initialization options for fetch
 * @return  A function suitable for a store action
 */
export function fetcher(
  path: string,
  url: string | URL,
  init: RequestInit = {}
) {
  return async function updater(this: Store) {
    try {
      const response = await fetch(url, init);
      this.setStateAt(path, { response, error: null });
    } catch (error) {
      this.setStateAt(path, { response: null, error });
    }
  };
}

/**
 * Helper function to send a fetch() request and add the response data to the state
 * @param path  The name of or path that will accept { data, status, ok, error }
 * @param url  The url to fetch data from
 * @param options  The options for fetch
 * @return  A function suitable for a store action
 */
export function jsonFetcher(
  path: string,
  url: string | URL,
  options: RequestInit = {}
) {
  return async function updater(this: Store) {
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      this.setStateAt(path, {
        data,
        status: response.status,
        ok: response.ok,
        error: null,
      });
    } catch (error) {
      this.setStateAt(path, {
        data: null,
        status: error.status,
        ok: error.ok,
        error,
      });
    }
  };
}
