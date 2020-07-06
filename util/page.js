import cuid from 'https://cdn.pika.dev/cuid'
import { DATA_FOLDER, getDataPath, getEntityPath } from './entity.js'

const FILE_NAME = 'page.md'
const TYPE = 'page'
const VERSION = 1

export async function createPage () {
  const entity = cuid()
  const path = getPageFilePath(entity)
  const metadata = {
    entity,
    type: TYPE,
    version: VERSION,
    icon: '',
    title: ''
  }
  await beaker.hyperdrive.writeFile(path, '', { metadata })
  return getEntityPath(entity)
}

export function getPageFilePath (entity) {
  return `${getDataPath(entity)}${FILE_NAME}`
}

export async function getPages (query = {}) {
  return await beaker.hyperdrive.query({
    path: `${DATA_FOLDER}/*/${FILE_NAME}`,
    reverse: true,
    sort: 'ctime',
    type: 'file',
    ...query
  })
}

export async function updatePageTitle (options = {}) {
  const { entity, title } = options
  const path = getPageFilePath(entity)
  await beaker.hyperdrive.updateMetadata(path, { title })
}
