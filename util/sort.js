export function sortBy (options) {
  const { key, reverse = false } = options
  const asc = reverse ? 1 : -1
  const desc = reverse ? -1 : 1
  return (a, b) => a[key] < b[key] ? asc : desc
}
