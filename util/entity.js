const DATA_FOLDER = '/data'

export function getDataPath (entity = getEntityId()) {
  return `${DATA_FOLDER}${getEntityPath(entity)}`
}

export function getEntityPath (entity = getEntityId()) {
  return `/${entity}/`
}

export function getEntityId (path = location.pathname) {
  const match = path.match(/\w+/)
  return match ? match[0] : null
}
