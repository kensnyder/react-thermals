export function replaceState(search: string): void {
  history.replaceState({}, document.title, search);
}
export function pushState(search: string): void {
  history.pushState({}, document.title, search);
}
