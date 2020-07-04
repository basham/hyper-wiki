import cuid from 'https://cdn.pika.dev/cuid'
import { define, html } from 'https://cdn.pika.dev/uce'
import { DATA_FOLDER, PAGE_ICON, PAGE_TITLE, TRASH_FOLDER } from '../constants.js'
import { getEntityId, getPagePath } from '../util.js'

//const entity = getEntityId()

let pathname = location.pathname
if (pathname.endsWith('/')) pathname += 'index.html'

const isTrashed = pathname.startsWith(TRASH_FOLDER, 1)

define('hw-root', {
  async init () {
    const content = await render()
    this.html`${content}`
  }
})

async function render () {
  try {
    return await renderFile()
  } catch (e) {
    try {
      return await renderEntity()
    } catch (e) {
      console.error(e)
      return render404()
    }
  }
}

function render404 () {
  return html`
    ${renderHeader()}
    <main>
      <article class='page padding-8'>
        <div class='page__body flex-wrap padding-t-4'>
          <article class='page__content flex-grow padding-4'>
            <h1>File not found</h1>
          </article>
        </div>
      </article>
    </main>
  `
}

async function renderFile () {
  const content = await parseFile(location.pathname)
  return html`
    ${renderHeader()}
    <main>
      <article class='page padding-8'>
        <div class='page__body flex-wrap padding-t-4'>
          <article class='page__content flex-grow padding-4'>
          ${html([content])}
          </article>
        </div>
      </article>
    </main>
  `
}

async function renderEntity () {
  const info = await beaker.hyperdrive.getInfo()
  const { ctime, mtime, metadata } = await beaker.hyperdrive.stat(getPagePath())
  const icon = metadata.icon || PAGE_ICON
  const title = metadata.title || PAGE_TITLE
  document.title = [title, info.title].filter((v) => v).join(' - ')
  document.getElementById('favicon').href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${icon}</text></svg>`

  /*
  const breadcrumbs = await getBreadcrumbs(pathname)
  const breadcrumbsHTML = breadcrumbs.map((path) =>
    html`<li><a href=${path} is='hw-link'></a></li>`
  )

  const linkRefs = await beaker.hyperdrive.query({
    path: JSON.parse(links)
  })
  const linkRefsHTML = linkRefs
    .map(({ path }) =>
      html`<dd>
        <a href='${path}' is='hw-link'></a>
        (<button onclick=${handleRemoveRelatedPage} data-path='${path}' type='button'>Remove</button>)
      </dd>`
    )

  const subpages = await beaker.hyperdrive.query({
    metadata: { parent: location.pathname },
    */
    //path: '*/*',
    /*
    reverse: true,
    sort: 'name',
    type: 'file'
  })
  const subpagesHTML = subpages.map(({ path }) =>
    html`<dd><a href=${path} is='hw-link'></a></dd>`
  )
  */
  const breadcrumbsHTML = html``
  const linkRefsHTML = html``
  const subpagesHTML = html``

  const header = renderHeader({
    breadcrumbs: html`
      ${breadcrumbsHTML}
      <li aria-current='page'>
        <a data-entity=${getEntityId()} is='hw-link'></a>
      </li>
    `
  })
  const content = await parseFile(getPagePath())

  return html`
    ${header}
    <main>
      <article class='page padding-8'>
        <div class='page__icon'>${icon}</div>
        <h1 class='padding-t-2'>${title}</h1>
        <div class='page__body flex-wrap padding-t-4'>
          <article class='page__content flex-grow padding-4'>
            ${html([content])}
          </article>
          <footer class='page__info padding-4'>
            <dl>
              <dt>Related pages</dt>
              ${linkRefsHTML}
              <dd class='flex-gap-2'>
                <button onclick=${handleAddRelatedPage} type='button'>
                  <hw-icon name='plus' />
                  Add related page
                </button>
              </dd>
              <dt>Subpages</dt>
              ${subpagesHTML}
              <dt>Created</dt>
              <dd>🕓 ${dateFormat(ctime)}</dt>
              <dt>Updated</dt>
              <dd>🕓 ${dateFormat(mtime)}</dt>
            </dl>
            <div class='flex-gap-2 padding-t-4'>
              <button onclick=${handleMovePage} type='button'>
                Move
              </button>
              <button .hidden=${isTrashed} onclick=${handleDeletePage} type='button'>
                Delete
              </button>
              <button .hidden=${!isTrashed} onclick=${handleRestorePage} type='button'>
                Restore
              </button>
            </div>
          </footer>
        </div>
      </article>
    </main>
    <hw-lookup-popup id='lookup' />
  `
}

function renderHeader (props = {}) {
  const { breadcrumbs = html`` } = props
  return html`
    <header class='flex-center flex-wrap border-bottom padding-1'>
      <nav aria-label='Breadcrumbs' class='flex-grow'>
        <ol class='list-plain list-pagination flex-center flex-wrap lh-4 padding-1'>
          <li>
            <a is='hw-link'></a>
          </li>
          ${breadcrumbs}
        </ol>
      </nav>
      <div class='flex-center flex-wrap padding-1'>
        <button onclick=${handleNewPage} type='button'>
          <hw-icon name='plus' />
          New page
        </button>
      </div>
    </header>
  `
}

async function getBreadcrumbs (path) {
  const stat = await beaker.hyperdrive.stat(path)
  const { parent } = stat.metadata
  if (parent) {
    const parentPaths = await getBreadcrumbs(parent)
    return [ ...parentPaths, parent ]
  }
  return []
}

async function handleNewPage () {
  const entity = cuid()
  const path = getPagePath(entity)
  const metadata = {
    entity,
    type: 'page',
    version: 1,
    icon: '',
    title: ''
  }
  await beaker.hyperdrive.writeFile(path, '', { metadata })
  window.location = `/${entity}`
}

async function handleMovePage () {
  try {
    const lookup = document.getElementById('lookup')
    const parent = await lookup.open({
      label: 'Move to page'
    })
    await beaker.hyperdrive.updateMetadata(pathname, { parent })
    window.location.reload()
  } catch (error) {}
}

async function handleDeletePage () {
  const fileName = pathname.split('/').reverse()[0]
  const fileUrl = `/${TRASH_FOLDER}/${fileName}`
  await beaker.hyperdrive.rename(pathname, fileUrl)
  window.location = fileUrl
}

async function handleRestorePage () {
  const fileName = pathname.split('/').reverse()[0]
  const fileUrl = `${DATA_FOLDER}/${fileName}`
  await beaker.hyperdrive.rename(pathname, fileUrl)
  window.location = fileUrl
}

async function handleAddRelatedPage (event) {
  try {
    const lookup = document.getElementById('lookup')
    const value = await lookup.open({
      label: 'Add related page'
    })
    await mergeLinks(pathname, [value])
    await mergeLinks(value, [pathname])
    window.location.reload()
  } catch (error) {}
}

async function handleRemoveRelatedPage (event) {
  const { path } = event.target.dataset
  await removeLink(pathname, path)
  await removeLink(path, pathname)
  window.location.reload()
}

async function mergeLinks (fromPath, toPaths) {
  const stat = await beaker.hyperdrive.stat(fromPath)
  const links = JSON.parse(stat.metadata.links || '[]')
  const linkSet = new Set([ ...links, ...toPaths ])
  await beaker.hyperdrive.updateMetadata(fromPath, {
    links: JSON.stringify(Array.from(linkSet))
  })
}

async function removeLink (fromPath, path) {
  const stat = await beaker.hyperdrive.stat(fromPath)
  const links = JSON.parse(stat.metadata.links || '[]')
    .filter((p) => p !== path)
  if (links.length) {
    await beaker.hyperdrive.updateMetadata(fromPath, {
      links: JSON.stringify(links)
    })
  } else {
    await beaker.hyperdrive.deleteMetadata(fromPath, 'links')
  }
}

async function parseFile (path) {
  const txt = await beaker.hyperdrive.readFile(path)
  if (/\.md$/i.test(path)) {
    return beaker.markdown.toHTML(txt)
  }
  if (/\.html$/i.test(path)) {
    return txt
  }
  const escapedTxt = txt
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return `<pre>${escapedTxt}</pre>`
}

function dateFormat (source) {
  return (new Date(source)).toLocaleString()
}
