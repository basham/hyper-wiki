import cuid from 'https://cdn.pika.dev/cuid'
import dayjs from 'https://cdn.pika.dev/dayjs'
import { css, define, html } from 'https://cdn.pika.dev/uce'

const a = {
  id: cuid(),
  startDate: '2020-07-17',
}

const b = {
  id: cuid(),
  startDate: '2020-07-18'
}

define('hw-dates', {
  style: selector => css`
    ${selector} {
    }
  `,
  init () {
    const sortDate = sortBy({ key: 'startDate', reverse: true })
    this.dates = [a, b].sort(sortDate)
    this.render()
    const _this = this
    document.addEventListener('add-date', (event) => {
      const { detail } = event
      _this.dates = [..._this.dates, detail]
        .sort(sortDate)
      _this.render()
    })
    document.addEventListener('edit-date', (event) => {
      const { detail } = event
      const { id } = detail
      _this.dates = _this.dates
        .map((d) => d.id === id ? detail : d)
        .sort(sortDate)
      _this.render()
    })
    document.addEventListener('remove-date', (event) => {
      const { id } = event.detail
      _this.dates = _this.dates
        .filter((d) => d.id !== id)
        .sort(sortDate)
      _this.render()
    })
  },
  render () {
    this.html`
      <div>
        <button onclick=${addDate}>
          Add date
        </button>
      </div>
      <ol class='list-plain'>
        ${this.dates.map(renderDate)}
      </ol>
    `
  }
})

function sortBy (options) {
  const { key, reverse = false } = options
  const asc = reverse ? 1 : -1
  const desc = reverse ? -1 : 1
  return (a, b) => a[key] < b[key] ? asc : desc
}

function renderDate (props) {
  const { id, startDate } = props
  return html`
    <li>
      <span>
        ${dayjs(startDate).format('ddd, MMM D, YYYY')}
      </span>
      <button
        onclick=${(event) => editDate(event, props)}>
        Edit
      </button>
      <button
        onclick=${(event) => removeDate(event, props)}>
        Remove
      </button>
    </li>
  `
}

function addDate () {
  const result = prompt('Add date')
  const date = dayjs(result)
  if (!date.isValid()) {
    return
  }
  const detail = {
    id: cuid(),
    startDate: date.format('YYYY-MM-DD')
  }
  const addDateEvent = new CustomEvent('add-date', { detail })
  document.dispatchEvent(addDateEvent)
}

function editDate (event, data) {
  const { id, startDate } = data
  const result = prompt('Edit date', startDate)
  const date = dayjs(result)
  if (!date.isValid()) {
    return
  }
  const detail = {
    id,
    startDate: date.format('YYYY-MM-DD')
  }
  const editDateEvent = new CustomEvent('edit-date', { detail })
  document.dispatchEvent(editDateEvent)
}

function removeDate (event, data) {
  const removeDateEvent = new CustomEvent('remove-date', { detail: data })
  document.dispatchEvent(removeDateEvent)
}
