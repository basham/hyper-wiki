import { define, html } from '../web_modules/uce.js'
import { getPages } from '../util/page.js'

define('hw-view-index', {
  async init () {
    const props = await load()
    this.html`${render(props)}`
  }
})

async function load () {
  const { title } = await beaker.hyperdrive.getInfo()
  const { active: activePages, deleted: inactivePages } = await getPages()
  return {
    activePages,
    inactivePages,
    title
  }
}

function render (props) {
  const { activePages, inactivePages, title } = props
  return html`
    <hw-header />
    <main class='page padding-8'>
      <h1>${title}</h1>
      <h2>Pages</h2>
      <ul class='list-plain'>
        ${activePages.map(renderPageLinkItem)}
      </ul>
      <h2>Trash</h2>
      <ul class='list-plain'>
        ${inactivePages.map(renderPageLinkItem)}
      </ul>
    </main>
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
