export function className (namespace) {
  return (value = '', ...other) => {
    const values = value
      .split(' ')
      .map((v) =>
        [namespace, v]
          .filter((k) => k)
          .join('-')
      )
    return [...values, ...other].join(' ')
  }
}

export function dispatch (eventName) {
  document.dispatchEvent(new CustomEvent(eventName))
}
