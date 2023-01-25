import Store from '../../classes/Store/Store';

/**
 * Helper function that gives you a function that will send a fetch() request and add the response to the state
 * @param path  The name of or path that will accept { response, error }
 * @param url  The url to fetch data from
 * @param options  The options for fetch
 * @return  A function suitable for a store action
 */
export function requester(
  path: string,
  url: string | URL,
  options: RequestInit = {}
) {
  return async function updater(this: Store) {
    // try {
    //   const response = await fetch(url, options);
    //   this.setStateAt(path, { response, error: null });
    // } catch (error) {
    //   this.setStateAt(path, { response: null, error });
    // }
  };
}
