import cuid from 'https://cdn.pika.dev/cuid'
import { DATA_FOLDER, getDataPath, getEntityPath } from './entity.js'
import { createStat, getStat, updateEntity } from './stat.js'
import { PAGE_ICON, PAGE_TITLE } from '../constants.js'

const FILE_NAME = 'page.json'
const TYPE = 'page'

export async function createPage () {
  const entity = cuid()
  const file = {
    entity,
    type: TYPE,
    icon: '',
    title: '',
    content: ''
  }
  await createStat(entity)
  await writePage(entity, file)
  return getEntityPath(entity)
}

export function getEntityFromPath (value) {
  const match = value.match(/c\w+/)
  return match ? match[0] : match
}

export function getPageFilePath (entity) {
  return `${getDataPath(entity)}${FILE_NAME}`
}

export async function getPage (entity) {
  const file = await readPage(entity)
  const { content: rawContent = '', icon: rawIcon = '', title: rawTitle = '' } = file
  const stat = await getStat(entity)
  const url = getEntityPath(entity)
  const defaultIcon = PAGE_ICON
  const defaultTitle = PAGE_TITLE
  return {
    ...file,
    ...stat,
    content: beaker.markdown.toHTML(rawContent),
    defaultIcon,
    defaultTitle,
    icon: rawIcon || PAGE_ICON,
    rawContent,
    rawIcon,
    rawTitle,
    title: rawTitle || PAGE_TITLE,
    url
  }
}

export function getPageFromPath (path) {
  const entity = getEntityFromPath(path)
  return getPage(entity)
}

export async function getPages (query = {}) {
  const results = await beaker.hyperdrive.query({
    path: `${DATA_FOLDER}/*/${FILE_NAME}`,
    reverse: true,
    sort: 'ctime',
    type: 'file',
    ...query
  })
  const all = await Promise.all(results.map(({ path }) => getPageFromPath(path)))
  const active = all
    .filter(({ isDeleted }) => !isDeleted)
  const deleted = all
    .filter(({ isDeleted }) => isDeleted)
  return {
    active,
    deleted
  }
}

export async function readPage (entity) {
  const path = getPageFilePath(entity)
  return await beaker.hyperdrive.readFile(path, 'json')
}

export async function updatePage (entity, data) {
  const file = await readPage(entity)
  await writePage(entity, { ...file, ...data })
  await updateEntity(entity)
}

export async function updatePageContent (entity, content) {
  await updatePage(entity, { content })
}

export async function updatePageIcon (entity, icon) {
  await updatePage(entity, { icon })
}

export async function updatePageTitle (entity, title) {
  await updatePage(entity, { title })
}

async function writePage (entity, data) {
  const path = getPageFilePath(entity)
  return await beaker.hyperdrive.writeFile(path, data, 'json')
}
