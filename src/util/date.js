import cuid from '../web_modules/cuid.js'
import dayjs from '../web_modules/dayjs.js'
import { DATA_FOLDER, getDataPath, getEntityId } from './entity.js'
import { sortBy } from './sort.js'

const FILE_NAME = 'date.json'
const TYPE = 'date'

const DATE_FORMAT = 'YYYY-MM-DD'
const DATE_DISPLAY = 'ddd, MMM D, YYYY'
const DATETIME_DISPLAY = `${DATE_DISPLAY}, h:mm A`

export function displayDateTime (value) {
  return dayjs(value).format(DATETIME_DISPLAY)
}

export async function createDate (data = {}) {
  const entity = getEntityId()
  const id = cuid()
  const path = getDateFilePath({ entity, id })
  const file = {
    id,
    entity,
    type: TYPE,
    ...data
  }
  await writeDate(entity, id, file)
}

export async function deleteDate (id) {
  const entity = getEntityId()
  const path = getDateFilePath({ entity, id })
  await beaker.hyperdrive.unlink(path)
}

export function formatDate (value) {
  return dayjs(value).format(DATE_FORMAT)
}

export async function getDate (path) {
  const file = await beaker.hyperdrive.readFile(path, 'json')
  const { startDate: rawStartDate } = file
  return {
    ...file,
    rawStartDate,
    startDate: dayjs(rawStartDate).format(DATE_DISPLAY)
  }
}

export async function getDates (entity = getEntityId()) {
  const results = await beaker.hyperdrive.query({
    path: `${DATA_FOLDER}/${entity}/*.${FILE_NAME}`,
    type: 'file'
  })
  const all = await Promise.all(results.map(({ path }) => getDate(path)))
  return all.sort(sortBy({ key: 'rawStartDate', reverse: true }))
}

export function getDateFilePath (options) {
  const { entity, id } = options
  return `${getDataPath(entity)}${id}.${FILE_NAME}`
}

export function isDateValid (value) {
  const isTypeValid = ['number', 'string']
    .includes(typeof value)
  return isTypeValid && dayjs(value).isValid()
}

export async function readDate (entity, id) {
  const path = getDateFilePath({ entity, id })
  return await beaker.hyperdrive.readFile(path, 'json')
}

export async function updateDate (options) {
  const { id, entity = getEntityId(), ...data } = options
  const file = await readDate(entity, id)
  await writeDate(entity, id, { ...file, ...data })
}

async function writeDate (entity, id, data) {
  const path = getDateFilePath({ entity, id })
  return await beaker.hyperdrive.writeFile(path, data, 'json')
}
