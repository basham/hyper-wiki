import { css, define, html } from 'https://cdn.pika.dev/uce'
import { displayDateTime } from '../util/date.js'
import { dispatch } from '../util/dom.js'
import { getPage, updatePageTitle } from '../util/page.js'

let pathname = location.pathname
if (pathname.endsWith('/')) pathname += 'index.html'

define('hw-view-page', {
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
    const props = await load()
    this.html`${render(props)}`
  }
})

async function load () {
  const page = await getPage()
  return page
}

function render (props) {
  const { entity, created, deleted, updated } = props
  const { content, defaultTitle, icon, rawContent, rawTitle, title } = props

  const linkRefsHTML = html``
  const subpagesHTML = html``

  return html`
    <hw-header
      class='header'
      deleted=${deleted}
      entity=${entity}
      icon=${icon}
      title=${title} />
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
          <dd>🕓 ${displayDateTime(created)}</dt>
          <dt>Updated</dt>
          <dd>🕓 ${displayDateTime(updated)}</dt>
          <dt .hidden=${!deleted}>Deleted</dt>
          <dd .hidden=${!deleted}>🕓 ${displayDateTime(deleted)}</dt>
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

async function getBreadcrumbs (path) {
  const stat = await beaker.hyperdrive.stat(path)
  const { parent } = stat.metadata
  if (parent) {
    const parentPaths = await getBreadcrumbs(parent)
    return [ ...parentPaths, parent ]
  }
  return []
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

async function handleEditPageTitle (event) {
  await updatePageTitle(ENTITY, event.target.innerText)
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

  //const editor = document.getElementById('editor-input')

  /*
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
