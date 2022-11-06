export function replaceState(search: string) {
  history.replaceState({}, document.title, search);
}
export function pushState(search: string) {
  history.pushState({}, document.title, search);
}
