import '/.ui/cb-list.js'

let pathname = location.pathname
if (pathname.endsWith('/')) pathname += 'index.html'

const $ = (sel, parent = document) => parent.querySelector(sel)
const root = $('#root')

async function init () {
  const info = await beaker.hyperdrive.getInfo(pathname)
  const { ctime, mtime, metadata } = await beaker.hyperdrive.stat(pathname)
  const { icon = '', title = pathname, links = '[]' } = metadata

  document.title = [title, info.title].filter((v) => v).join(' - ')
  document.getElementById('favicon').href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${icon}</text></svg>`

  const linkRefs = await beaker.hyperdrive.query({
    path: JSON.parse(links)
  })
  const linkRefsHTML = linkRefs
    .map(({ path, stat }) =>
      `<dd><a href="${path}">${stat.metadata.icon || ''} ${stat.metadata.title || path}</a> (<button data-type="remove-link" data-path="${path}" type="button">Remove</button>)</dd>`
    )
    .join('')

  const page = await parsePage()
  root.innerHTML = `
    <header class="flex-center border-bottom padding-2">
      <nav aria-label="Breadcrumbs" class="flex-grow">
        <ol class="list-plain list-pagination flex-center">
          <li aria-current="page">
            <a href="/">${info.title}</a>
          </li>
          <li aria-current="page">
            ${icon} ${title}
          </li>
        </ol>
      </nav>
      <div>
        <button>New page</button>
      </div>
    </header>
    <main>
      <article class="padding-8">
        <div class="icon">${icon}</div>
        <h1>${title}</h1>
        <footer>
          <dl>
            <dt>Created</dt>
            <dd>${dateFormat(ctime)}</dt>
            <dt>Modified</dt>
            <dd>${dateFormat(mtime)}</dt>
            <dt>Links</dt>
            ${linkRefsHTML}
            <dd><button id="add-link" type="button">Add link</button></dd>
          </dl>
        </footer>
        <article>
          ${page}
        </article>
      </article>
    </main>
  `
  const addLinkButton = $('#add-link')
  addLinkButton.addEventListener('click', handleAddLink)

  const removeLinkButtons = Array.from(document.querySelectorAll('button[data-type="remove-link"]'))
  removeLinkButtons.forEach((button) =>
    button.addEventListener('click', handleRemoveLink)
  )
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

init()

function dateFormat (source) {
  return (new Date(source)).toDateString()
}
