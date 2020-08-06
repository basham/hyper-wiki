export function dispatch (eventName) {
  document.dispatchEvent(new CustomEvent(eventName))
}
