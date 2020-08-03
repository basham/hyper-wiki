import { css, define, html } from '../web_modules/uce.js'
import { displayDateTime } from '../util/date.js'
import { dispatch } from '../util/dom.js'
import { getPage, updatePageIcon, updatePageTitle } from '../util/page.js'

let pathname = location.pathname
if (pathname.endsWith('/')) pathname += 'index.html'

define('hw-view-page', {
  style: selector => css`
    ${selector} .main {
      margin: 0 auto;
      max-width: 80rem;
      width: 100%;
    }

    ${selector} .button-icon {
      font-size: var(--size-8);
      height: inherit;
      line-height: var(--size-8);
      padding: var(--size-0);
    }

    ${selector} .heading {
      font-size: var(--size-5);
      line-height: var(--size-6);
      margin: 0;
      padding: 0;
    }

    ${selector} .editor {
      background-color: var(--color-black-0);
      border: var(--border);
      border-radius: var(--size-0);
    }

    ${selector} .editor__input {
      background-color: transparent;
      border: none;
      font-family: var(--font-code);
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
  `,
  init () {
    document.addEventListener('render', this.render.bind(this))
    this.render()
  },
  async render () {
    const props = await load()
    this.html`${render(props)}`
    resizeEditor()
  }
})

async function load () {
  const page = await getPage()
  const { deleted, rawContent } = page
  const editor = document.getElementById('editor-input')
  const editorValue = editor && !deleted ? editor.value : rawContent
  const unsaved = editorValue !== rawContent && !deleted
  return {
    ...page,
    content: beaker.markdown.toHTML(editorValue),
    editorValue,
    unsaved
  }
}

function render (props) {
  const { entity, created, deleted, updated } = props
  const { content, defaultTitle, editorValue, icon, rawTitle, title, unsaved } = props

  const linkRefsHTML = html``
  const subpagesHTML = html``

  return html`
    <hw-header
      deleted=${deleted}
      entity=${entity}
      icon=${icon}
      title=${title}
      unsaved=${unsaved} />
    <main class='main padding-8'>
      <div>
        <button
          class='button-icon'
          onclick=${handleEditPageIcon(props)}>
          ${icon}
        </button>
      </div>
      <div class='padding-t-2'>
        <h1
          class='heading'
          contenteditable=${deleted ? 'false' : 'true'}
          .innerText=${rawTitle}
          onblur=${handleEditPageTitleBlur(props)}
          onkeydown=${handleEditPageTitleKeydown(props)}
          placeholder=${defaultTitle}>
        </h1>
      </div>
      <div class='flex flex-gap-4 flex-wrap padding-t-4'>
        <article
          class='content flex-basis-20 flex-grow'
          id='content'>
          ${html([content])}
        </article>
        <div
          class='editor flex-basis-20 flex-grow'
          .hidden=${deleted}>
          <textarea
            class='editor__input'
            id='editor-input'
            oninput=${handleEditorInput}
            .value=${editorValue}></textarea>
        </div>
      </div>
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

function resizeEditor () {
  const editor = document.getElementById('editor-input')
  if (editor) {
    editor.style.height = 0
    editor.style.height = `${editor.scrollHeight}px`
  }
}

function handleEditorInput () {
  dispatch('render')
}

function handleEditPageIcon (props) {
  const { entity, rawIcon } = props
  return async () => {
    const result = prompt('Edit icon', rawIcon)
    if (result !== false) {
      await updatePageIcon(entity, result)
      dispatch('render')
    }
  }
}

async function handleEditPageTitle (props, event) {
  const { entity, rawTitle } = props
  const newTitle = event.target.innerText
  if (newTitle !== rawTitle) {
    await updatePageTitle(entity, newTitle)
    dispatch('render')
  }
}

function handleEditPageTitleBlur (props) {
  return async (event) => {
    await handleEditPageTitle(props, event)
  }
}

function handleEditPageTitleKeydown (props) {
  return async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      await handleEditPageTitle(props, event)
    }
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
