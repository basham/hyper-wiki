import { define, html } from '../web_modules/uce.js'
import { dispatch } from '../util/dom.js'
import { createPage, updatePageContent } from '../util/page.js'
import { deleteEntity, restoreEntity } from '../util/stat.js'

define('hw-header', {
  async init () {
    this.dispatchEvent(new CustomEvent('loading', { bubbles: true }))
    await this.render()
    this.dispatchEvent(new CustomEvent('loaded', { bubbles: true }))
  },
  observedAttributes: ['deleted', 'entity', 'icon', 'title', 'unsaved'],
  attributeChanged () {
    this.render()
  },
  async render () {
    const props = await load(this.props)
    this.html`${render(props)}`
  }
})

async function load (props) {
  const { title, unsaved } = props
  const info = await beaker.hyperdrive.getInfo()
  const driveTitle = info.title
  const documentTitle = [title, driveTitle]
    .filter((v) => v)
    .join(' - ')
  return {
    ...props,
    documentTitle,
    driveTitle,
    unsaved: unsaved === 'true'
  }
}

function render (props) {
  const { deleted = false, driveTitle, entity = false, unsaved } = props
  updateDocumentHead(props)
  return html`
    <header class='header'>
      <div class='flex flex-middle flex-wrap border-bottom padding-1'>
        <nav
          aria-label='Breadcrumbs'
          class='flex-grow'>
          <ol class='list-plain list-pagination flex-middle flex-wrap lh-3 padding-1'>
            <li>
              <a is='hw-link'>${driveTitle}</a>
            </li>
            ${renderCurrentPage(props)}
          </ol>
        </nav>
        <div class='flex flex-gap-1 flex-middle flex-wrap padding-1'>
          <button onclick=${handleNewPage}>
            <hw-icon name='plus' />
            New
          </button>
          <button
            .hidden=${!entity || deleted}
            onclick=${handleSave(props)}>
            <hw-icon name='save' />
            Save
          </button>
          <button
            .hidden=${!entity || deleted}
            onclick=${handleMovePage}>
            <hw-icon name='corner-up-right' />
            Move
          </button>
          <button
            .hidden=${!entity || deleted}
            onclick=${handleDeletePage(props)}>
            <hw-icon name='trash' />
            Delete
          </button>
        </div>
      </div>
      <div
        class='bg-black-0 border-bottom padding-2'
        .hidden=${!deleted}>
        <div class='flex flex-center flex-gap-2 flex-middle flex-wrap'>
          <div>Page is trashed.</div>
          <button onclick=${handleRestorePage(props)}>
            <hw-icon name='rotate-ccw' />
            Restore
          </button>
          <button>
            <hw-icon name='trash' />
            Delete permanently
          </button>
        </div>
      </div>
    </header>
  `
}

function renderCurrentPage (props) {
  const { entity } = props
  if (!entity) {
    return null
  }
  return html`
    <li
      aria-current='page'
      class='flex-inline'>
      <a
        data-entity=${entity}
        is='hw-link'></a>
      <span
        class='color-text-light padding-l-1'
        id='page-status'
        role='status'>
        ${renderUnsaved(props)}
      </span>
    </li>
  `
}

function renderUnsaved (props) {
  const { unsaved } = props
  if (!unsaved) {
    return null
  }
  return html`
    <span aria-hidden='true' title='Unsaved'>*</span>
    <span class='sr-only'>Unsaved</span>
  `
}

function updateDocumentHead (props) {
  const { documentTitle, icon } = props
  document.title = documentTitle
  if (!icon) {
    return
  }
  document.getElementById('favicon').href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${icon}</text></svg>`
}

async function handleNewPage () {
  window.location = await createPage()
}

async function handleMovePage () {
  try {
    const lookup = document.getElementById('lookup')
    const parent = await lookup.open({
      label: 'Move to page'
    })
    // await beaker.hyperdrive.updateMetadata(pathname, { parent })
    dispatch('render')
  } catch (error) {}
}

function handleDeletePage (props) {
  const { entity } = props
  return async () => {
    await deleteEntity(entity)
    dispatch('render')
  }
}

function handleRestorePage (props) {
  const { entity } = props
  return async () => {
    await restoreEntity(entity)
    dispatch('render')
  }
}

function handleSave (props) {
  const { entity } = props
  return async () => {
    const { value } = document.getElementById('editor-input')
    await updatePageContent(entity, value)
    dispatch('render')
  }
}

/*
const breadcrumbs = await getBreadcrumbs(pathname)
const breadcrumbsHTML = breadcrumbs.map((path) =>
  html`<li><a href=${path} is='hw-link'></a></li>`
)
*/
