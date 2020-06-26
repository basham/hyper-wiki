import cuid from 'https://cdn.pika.dev/cuid'
import { define, html } from 'https://cdn.pika.dev/uce'
import { PAGE_FOLDER, PAGE_ICON, PAGE_TITLE, TRASH_FOLDER } from '../constants.js'

let pathname = location.pathname
if (pathname.endsWith('/')) pathname += 'index.html'

const isTrashed = pathname.startsWith(TRASH_FOLDER, 1)

define('hw-root', {
  async init () {
    const info = await beaker.hyperdrive.getInfo(pathname)
    const { ctime, mtime, metadata } = await beaker.hyperdrive.stat(pathname)
    const { icon = PAGE_ICON, title = PAGE_TITLE, links = '[]' } = metadata

    document.title = [title, info.title].filter((v) => v).join(' - ')
    document.getElementById('favicon').href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${icon}</text></svg>`

    const linkRefs = await beaker.hyperdrive.query({
      path: JSON.parse(links)
    })
    const linkRefsHTML = linkRefs
      .map(({ path }) =>
        html`<dd>
          <a href='${path}' is='hw-link'></a>
          (<button onclick=${handleRemoveLink} data-path='${path}' type='button'>Remove</button>)
        </dd>`
      )

    const page = await parsePage()

    this.html`
      <header class='flex-center border-bottom padding-2'>
        <nav aria-label='Breadcrumbs' class='flex-grow'>
          <ol class='list-plain list-pagination flex-center'>
            <li>
              <a href='/'>${info.title}</a>
            </li>
            <li aria-current='page'>
              <a href='${pathname}' is='hw-link'></a>
            </li>
          </ol>
        </nav>
        <div>
          <button onclick=${handleNewPage} type='button'>
            <hw-icon name='plus' />
            New page
          </button>
        </div>
      </header>
      <main>
        <article class='page padding-8'>
          <div class='page__icon'>${icon}</div>
          <h1 class='padding-t-2'>${title}</h1>
          <div class='page__body flex-wrap padding-t-4'>
            <article class='page__content flex-grow padding-4'>
            </article>
            <footer class='page__info padding-4'>
              <dl>
                <dt>Related pages</dt>
                ${linkRefsHTML}
                <dd>
                  <button onclick=${handleAddLink} type='button'>
                    <hw-icon name='plus' />
                    Add link
                  </button>
                </dd>
                <dt>Created</dt>
                <dd>🕓 ${dateFormat(ctime)}</dt>
                <dt>Updated</dt>
                <dd>🕓 ${dateFormat(mtime)}</dt>
              </dl>
              <div class='flex-gap-2 padding-t-4'>
                <button class='' onclick=${handleMovePage} type='button'>
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
    `
    this.querySelector('.page__content').innerHTML = page
  }
})

async function handleNewPage () {
  const { url } = await beaker.hyperdrive.getInfo(pathname)
  const fileUrl = `${url}${PAGE_FOLDER}/${cuid()}.md`
  await beaker.hyperdrive.writeFile(fileUrl, '')
  window.location = fileUrl
}

async function handleMovePage () {
  const info = await beaker.hyperdrive.getInfo(pathname)
  const files = await beaker.shell.selectFileDialog({
    title: 'Select Page',
    buttonLabel: 'Select',
    drive: info.url,
    select: ['file'],
    filters: {
      extensions: ['md', 'html']
    },
    allowMultiple: false,
    disallowCreate: true
  })
  const { path } = files[0]
  await beaker.hyperdrive.updateMetadata(pathname, {
    parent: path
  })
}

async function handleDeletePage () {
  const fileName = pathname.split('/').reverse()[0]
  const fileUrl = `/${TRASH_FOLDER}/${fileName}`
  await beaker.hyperdrive.rename(pathname, fileUrl)
  window.location = fileUrl
}

async function handleRestorePage () {
  const fileName = pathname.split('/').reverse()[0]
  const fileUrl = `/${PAGE_FOLDER}/${fileName}`
  await beaker.hyperdrive.rename(pathname, fileUrl)
  window.location = fileUrl
}

async function handleAddLink () {
  const info = await beaker.hyperdrive.getInfo(pathname)
  const files = await beaker.shell.selectFileDialog({
    title: 'Select Page',
    buttonLabel: 'Select',
    drive: info.url,
    select: ['file'],
    filters: {
      extensions: ['md', 'html'],
      writable: true
    },
    allowMultiple: true,
    disallowCreate: true
  })

  const filePaths = files.map(({ path }) => path)
  await mergeLinks(pathname, filePaths)

  for (const file of files) {
    await mergeLinks(file.url, [pathname])
  }

  window.location.reload()
}

async function handleRemoveLink (event) {
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

async function parsePage () {
  const txt = await beaker.hyperdrive.readFile(pathname)
  if (/\.md$/i.test(pathname)) {
    return beaker.markdown.toHTML(txt)
  }
  if (/\.html$/i.test(pathname)) {
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
