import { css, define, html } from 'https://cdn.pika.dev/uce'
import { displayDateTime } from '../util/date.js'
import { getEntityId } from '../util/entity.js'
import { deleteEntity, restoreEntity } from '../util/trash.js'
import { createPage, getPage, getPages, updatePage } from '../util/page.js'

let pathname = location.pathname
if (pathname.endsWith('/')) pathname += 'index.html'

define('hw-root', {
  style: selector => css`
    ${selector} {
      display: grid;
      grid-template-areas:
        "header header"
        "main editor";
      grid-template-columns: 1fr minmax(20rem, 50vw);
      grid-template-rows: auto 1fr;
      min-height: 100vh;
    }

    ${selector} .header {
      grid-area: header;
    }

    ${selector} .main {
      grid-area: main;
      margin: 0 auto;
      max-width: 60rem;
      width: 100%;
    }

    ${selector} .editor {
      background-color: var(--color-black-0);
      border-left: var(--px-1) solid var(--color-black-1);
      grid-area: editor;
    }

    ${selector} .editor__input {
      background-color: transparent;
      border: none;
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
      min-height: 100%;
      padding: var(--size-2);
      resize: none;
      width: 100%;
    }

    ${selector} .editor__input:focus {
      outline: none;
    }

    ${selector} .icon {
      font-size: var(--size-8);
      line-height: var(--size-8);
    }
  `,
  async init () {
    this.render()
    document.addEventListener('render', this.render.bind(this))
  },
  async render () {
    const content = await render()
    this.html`${content}`
  }
})

async function render () {
  if (location.pathname === '/') {
    return await renderIndex()
  }
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
    <main class='page padding-8'>
      <h1>File not found</h1>
    </main>
  `
}

async function renderIndex () {
  const info = await beaker.hyperdrive.getInfo()
  const pages = await getPages()
  return html`
    ${renderHeader()}
    <main class='page padding-8'>
      <h1>${info.title}</h1>
      <h2>Pages</h2>
      <ul class='list-plain'>
        ${pages.active.map(renderPageLinkItem)}
      </ul>
      <h2>Trash</h2>
      <ul class='list-plain'>
        ${pages.deleted.map(renderPageLinkItem)}
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

async function renderFile () {
  const content = await parseFile(location.pathname)
  return html`
    ${renderHeader()}
    <main class='page padding-8'>
      ${html([content])}
    </main>
  `
}

async function renderEntity () {
  const info = await beaker.hyperdrive.getInfo()
  const page = await getPage()
  const { ctime, dtime, mtime, deleted } = page
  const { content, icon, title } = page
  const { defaultTitle } = page
  const { rawContent, rawTitle } = page

  document.title = [title, info.title]
    .filter((v) => v)
    .join(' - ')
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
      <li
        aria-current='page'
        class='flex-inline'>
        <a data-entity=${getEntityId()} is='hw-link'></a>
        <span
          class='color-text-light padding-l-1'
          id='page-status'
          role='status'>
        </span>
      </li>
    `,
    isEntity: true,
    deleted
  })

  return html`
    ${header}
    <main class='main padding-8'>
      <div class='icon'>${icon}</div>
      <div class='padding-t-2'>
        <h1
          contenteditable=${deleted ? 'false' : 'true'}
          .innerText=${rawTitle}
          onblur=${handleEditPageTitleBlur}
          onkeydown=${handleEditPageTitleKeydown}
          placeholder=${defaultTitle}>
        </h1>
      </div>
      <article
        class='content padding-t-4'
        id='content'>
        ${html([content])}
      </article>
      <div class='padding-t-4'>
        <h2>Dates</h2>
        <hw-dates />
      </div>
      <div class='content padding-t-4'>
        <dl>
          <dt>Related pages</dt>
          ${linkRefsHTML}
          <dd class='flex-gap-2'>
            <button
              onclick=${handleAddRelatedPage}
              type='button'>
              <hw-icon name='plus' />
              Add related page
            </button>
          </dd>
          <dt>Subpages</dt>
          ${subpagesHTML}
          <dt>Created</dt>
          <dd>🕓 ${displayDateTime(ctime)}</dt>
          <dt>Updated</dt>
          <dd>🕓 ${displayDateTime(mtime)}</dt>
          <dt .hidden=${!deleted}>Deleted</dt>
          <dd .hidden=${!deleted}>🕓 ${displayDateTime(dtime)}</dt>
        </dl>
      </div>
      <hw-lookup-popup id='lookup' />
    </main>
    <div
      class='editor'
      .hidden=${deleted}>
      <textarea
        class='editor__input'
        id='editor-input'
        oninput=${handleEditorInput}
        .value=${rawContent}></textarea>
    </div>
  `
}

function renderHeader (props = {}) {
  const { breadcrumbs = html``, isEntity = false, deleted } = props
  return html`
    <header class='header'>
      <div class='flex flex-middle flex-wrap border-bottom padding-1'>
        <nav
          aria-label='Breadcrumbs'
          class='flex-grow'>
          <ol class='list-plain list-pagination flex-middle flex-wrap lh-4 padding-1'>
            <li>
              <a is='hw-link'></a>
            </li>
            ${breadcrumbs}
          </ol>
        </nav>
        <div class='flex flex-gap-1 flex-middle flex-wrap padding-1'>
          <button onclick=${handleNewPage}>
            <hw-icon name='plus' />
            New
          </button>
          <button
            .hidden=${!isEntity || deleted}
            onclick=${handleSave}>
            <hw-icon name='save' />
            Save
          </button>
          <button
            .hidden=${!isEntity || deleted}
            onclick=${handleMovePage}>
            <hw-icon name='corner-up-right' />
            Move
          </button>
          <button
            .hidden=${!isEntity || deleted}
            onclick=${handleDeletePage}>
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
          <button onclick=${handleRestorePage}>
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

async function getBreadcrumbs (path) {
  const stat = await beaker.hyperdrive.stat(path)
  const { parent } = stat.metadata
  if (parent) {
    const parentPaths = await getBreadcrumbs(parent)
    return [ ...parentPaths, parent ]
  }
  return []
}

async function handleSave (event) {
  const { value } = document.getElementById('editor-input')
  await updatePage({ content: value })
  document.getElementById('page-status').innerHTML = ''
}

function handleEditorInput (event) {
  const { target } = event
  target.style.height = 0
  target.style.height = `${target.scrollHeight}px`

  const markup = beaker.markdown.toHTML(target.value)
  document.getElementById('content').innerHTML = markup

  document.getElementById('page-status').innerHTML = `
    <span aria-hidden='true' title='Unsaved'>*</span>
    <span class='sr-only'>Unsaved</span>
  `
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
    await beaker.hyperdrive.updateMetadata(pathname, { parent })
    dispatch('render')
  } catch (error) {}
}

async function handleDeletePage () {
  await deleteEntity()
  dispatch('render')
}

async function handleRestorePage () {
  await restoreEntity()
  dispatch('render')
}

async function handleEditPageTitle (event) {
  await updatePage({ title: event.target.innerText })
  dispatch('render')
}

async function handleEditPageTitleBlur (event) {
  await handleEditPageTitle(event)
}

async function handleEditPageTitleKeydown (event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    await handleEditPageTitle(event)
  }
}

async function handleAddRelatedPage (event) {
  try {
    const lookup = document.getElementById('lookup')
    const value = await lookup.open({
      label: 'Add related page'
    })
    await mergeLinks(pathname, [value])
    await mergeLinks(value, [pathname])
    dispatch('render')
  } catch (error) {}
}

async function handleRemoveRelatedPage (event) {
  const { path } = event.target.dataset
  await removeLink(pathname, path)
  await removeLink(path, pathname)
  dispatch('render')
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
  return `<pre><div class='fs-1'>${escapedTxt}</div></pre>`
}

function dispatch (eventName) {
  document.dispatchEvent(new CustomEvent(eventName))
}
