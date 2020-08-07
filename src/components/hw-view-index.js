import { define, html } from '../web_modules/uce.js'
import { getPages } from '../util/page.js'

define('hw-view-index', {
  async init () {
    this.dispatchEvent(new CustomEvent('loading', { bubbles: true }))
    const props = await load()
    this.html`${render(props)}`
    this.dispatchEvent(new CustomEvent('loaded', { bubbles: true }))
  }
})

async function load () {
  const { title } = await beaker.hyperdrive.getInfo()
  const { active: activePages, deleted: inactivePages } = await getPages()
  const pagesByDate = new Map()
  const pagesWithoutDates = new Set()
  const dates = new Map()
  activePages.forEach((page) => {
    if (!page.dates.length) {
      pagesWithoutDates.add(page)
      return
    }
    page.dates.forEach((date) => {
      const { rawStartDate: key } = date
      dates.set(key, date)
      if (!pagesByDate.has(key)) {
        pagesByDate.set(key, new Set())
      }
      pagesByDate.get(key).add(page)
    })
  })
  const groupedPagesByDate = [...dates.keys()]
    .sort()
    .reverse()
    .map((key) => {
      const title = dates.get(key).startDate
      const pages = [...pagesByDate.get(key).values()]
      return { title, pages }
    })
  const otherPages = { title: 'Pages', pages: [...pagesWithoutDates.values()] }
  const otherPagesGroup = pagesWithoutDates.size ? [otherPages] : []
  const trashedPages = { title: 'Trash', pages: inactivePages }
  const trashedPagesGroup = inactivePages.length ? [trashedPages] : []
  const groupedPages = [
    ...groupedPagesByDate,
    ...otherPagesGroup,
    ...trashedPagesGroup
  ]
  return {
    groupedPages,
    title
  }
}

function render (props) {
  const { groupedPages, title } = props
  return html`
    <hw-header />
    <main class='content padding-8'>
      <h1>${title}</h1>
      ${groupedPages.map(renderGroup)}
    </main>
  `
}

function renderGroup (props) {
  const { title, pages } = props
  return html`
    <h2>${title}</h2>
    <ul class='list-plain'>
      ${pages.map(renderPageLinkItem)}
    </ul>
  `
}

function renderPageLinkItem (props) {
  const { entity } = props
  return html`
    <li>
      <a
        data-entity=${entity}
        is='hw-link'></a>
    </li>
  `
}
