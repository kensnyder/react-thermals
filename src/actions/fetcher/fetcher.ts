import isFunction from '../../lib/isFunction/isFunction';

/**
 * Helper function to send a fetch() request and add the response to the state
 * @param url  The url to fetch data from
 * @param init  The initialization options for fetch
 * @param extractor  A function that receives the response object and returns new state
 *   It defaults to the function `res => res.json()`
 * @return  A function suitable for a store action
 * @example
 * const store = new Store({ products: [] });
 * const loadProducts = store.connect(
 *   'products',
 *   fetcher(
 *     '/api/products',
 *     { headers: { Authorization: `Bearer ${token}` } },
 *   )
 * );
 *
 * // Or using a function to generate the url
 * const searchProducts = store.connect(
 *   'products',
 *   fetcher(
 *     (criteria) => '/api/products?' + new URLSearchParams(criteria).toString(),
 *     { headers: { Authorization: `Bearer ${token}` } }
 *   )
 * );
 * searchProducts({ category: 'shoes', size: '10' });
 * // `store.getStateAt('products')` now contains search results
 *
 * // Or using a function to generate the initialization options
 * const addToCart = store.connect(
 *   'cart',
 *   fetcher(
 *     '/api/cart',
 *     (productId) => ({ body: { productId }, method: 'POST' })
 *   )
 * );
 * // assuming `POST /api/cart` returns the new cart contents,
 * // `store.getStateAt('cart')` now contains those cart contents
 */
export function fetcher(
  url: string | URL | ((...args: any[]) => string | URL),
  init: RequestInit | ((...args: any[]) => RequestInit) = {},
  extractor: (response: Response) => any = response => response.json()
) {
  return function updater(...args: any[]) {
    return () => {
      let finalUrl;
      let finalInit;
      if (isFunction(url)) {
        finalUrl = url(...args);
      } else {
        finalUrl = url;
      }
      if (isFunction(init)) {
        finalInit = init(...args);
      } else {
        finalInit = init;
      }
      return fetch(finalUrl, finalInit).then(extractor);
    };
  };
}
