import { DATA_FOLDER } from './constants.js'

export function getEntityId (path = location.pathname) {
  const match = path.match(/\w+/)
  return match ? match[0] : null
}

export function getPagePath (entity = getEntityId()) {
  return `${DATA_FOLDER}/${entity}/page.md`
}
