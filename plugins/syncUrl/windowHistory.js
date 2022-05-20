export function replaceState(search) {
  window.history.replaceState({}, document.title, search);
}
export function pushState(search) {
  window.history.pushState({}, document.title, search);
}
