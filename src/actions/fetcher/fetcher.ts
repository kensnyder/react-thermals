import Store from '../../classes/Store/Store';

type FetcherOptions = {
  path?: string;
  url: string | URL;
  init?: RequestInit;
  extractor: (r: Response) => any;
};

/**
 * Helper function to send a fetch() request and add the response to the state
 * @param path  The path that will get set with resulting data
 * @param url  The url to fetch data from
 * @param init  The initialization options for fetch
 * @param extractor  A function that receives the response object and returns new state
 * @return  A function suitable for a store action
 */
export function fetcher({
  path = '@',
  url,
  init = {},
  extractor,
}: FetcherOptions) {
  return async function updater(this: Store) {
    const response = await fetch(url, init);
    const extracted = await extractor(response);
    this.setStateAt(path, extracted);
  };
}

type JsonFetcherOptions = {
  path?: string;
  url: string | URL;
  init?: RequestInit;
  transformer?: (data: any) => any;
};

/**
 * Helper function to send a fetch() request and add the response to the state
 * @param path  The path that will get set with resulting data
 * @param url  The url to fetch data from
 * @param init  The initialization options for fetch
 * @param transformer  A function to transform the json after being fetched
 * @return  A function suitable for a store action
 */
export function jsonFetcher({
  path = '@',
  url,
  init = {},
  transformer = k => k,
}: JsonFetcherOptions) {
  return async function updater(this: Store) {
    const response = await fetch(url, init);
    const data = await response.json();
    const transformed = await transformer(data);
    this.setStateAt(path, transformed);
  };
}
