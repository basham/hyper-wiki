import cuid from 'https://cdn.pika.dev/cuid'
import { css, define, html, render } from 'https://cdn.pika.dev/uce'
import { MAX_RESULTS, PAGE_ICON, PAGE_TITLE } from '../constants.js'

const cn = cuid()

define('hw-lookup-popup', {
  style: () => css`
    .${cn} {
      height: 100vh;
      left: 0;
      position: absolute;
      top: 0;
      width: 100vw;
    }

    .${cn} .popup {
      background-color: var(--color-white);
    }

    .${cn} .popup__icon {
      left: var(--size-1);
      position: absolute;
      top: var(--size-1);
    }

    .${cn} .popup__option {
      line-height: var(--px-20);
      padding: var(--px-6) var(--size-2);
    }

    .${cn} .popup__option:hover,
    .${cn} .popup__option[aria-selected="true"] {
      background-color: var(--color-blue-6);
      color: var(--color-white);
      cursor: pointer;
    }

    .${cn} .popup__option:hover .popup__option-small,
    .${cn} .popup__option[aria-selected="true"] .popup__option-small {
      color: var(--color-white);
    }

    .${cn} .popup__empty {
      padding: var(--size-1) var(--size-1) var(--size-1) var(--size-6);
    }
  `,
  init () {
    this._isOpen = false
    this._id = cuid()
  },
  async open () {
    if (this.isOpen) {
      return
    }
    this._isOpen = true
    this._activeElement = document.activeElement
    this._container = document.createElement('div')
    this._container.classList.add(cn)
    document.body.append(this._container)
    const pages = await beaker.hyperdrive.query({
      path: '*/*.md',
      reverse: true,
      sort: 'mtime',
      type: 'file'
    })
    const pagesIndex = new Map()
    pages.forEach(({ path, stat }) => {
      const { icon = PAGE_ICON, parent, title = PAGE_TITLE } = stat.metadata
      const id = path.replace(/[\/.]/g, '')
      const page = { icon, id, parent, path, title }
      pagesIndex.set(path, page)
    })
    this._allOptions = Array.from(pagesIndex.values()).map((page) => {
      const hasParent = pagesIndex.has(page.parent)
      const parentPage = hasParent ? pagesIndex.get(page.parent) : null
      return { ...page, hasParent, parentPage }
    })
    this._options = this._allOptions
    this._selectedIndex = 0
    this.render()
  },
  close () {
    if (!this._isOpen) {
      return
    }
    this._isOpen = false
    this._container.remove()
    this._activeElement.focus()
  },
  render () {
    const { label } = this.props
    const labelId = `${this._id}-label`
    const inputId = `${this._id}-input`
    const listboxId = `${this._id}-listbox`
    this._optionsCount = this._options.length
    const hasOptions = this._optionsCount > 0
    const selectedId = this._selectedIndex && hasOptions ? this._options[this._selectedIndex].id : null
    render(this._container, html`
      <div
        class='popup border-bottom padding-1'
        tabindex='-1'>
        <h1 class='fs-2 lh-3 padding-1'>
          <label
            for=${inputId}
            id=${labelId}>
            ${label}
          </label>
        </h1>
        <div
          aria-expanded=${hasOptions}
          aria-haspopup='listbox'
          aria-owns=${listboxId}
          class='padding-1 pos-rel'
          role='combobox'>
          <hw-icon
            class='popup__icon color-text-light padding-1'
            name='search' />
          <input
            aria-activedescendant=${selectedId}
            aria-autocomplete='list'
            aria-controls=${listboxId}
            class='padding-l-5'
            id=${inputId}
            placeholder='Search for a page…'
            oninput=${this.handleInputChange.bind(this)}
            onkeydown=${this.handleInputKeyDown.bind(this)}
            type='search' />
        </div>
        <ul
          aria-labelledby=${labelId}
          class='list-plain padding-1'
          .hidden=${!hasOptions}
          id=${listboxId}
          role='listbox'>
          ${this._options.map(renderOption.bind(this))}
        </ul>
        <div
          class='popup__empty lh-4'
          .hidden=${hasOptions}>
          No results
        </div>
      </div>
    `)
    document.getElementById(inputId).focus()
  },
  handleInputChange (event) {
    const { value } = event.target
    this._options = this._allOptions
      .filter(({ title }) =>
        title.toLowerCase().indexOf(value.trim().toLowerCase()) !== -1
      )
      .slice(0, MAX_RESULTS)
    this._selectedIndex = 0
    this.render()
  },
  handleInputKeyDown (event) {
    const { key } = event
    const i = this._selectedIndex
    const lastIndex = this._optionsCount - 1
    switch (key) {
      case 'ArrowDown':
        this._selectedIndex = i === lastIndex ? 0 : i + 1
        this.render()
        return
      case 'ArrowUp':
        this._selectedIndex = i === 0 ? lastIndex : i - 1
        this.render()
        return
      case 'Enter':
        this.close()
        return
      case 'Escape':
        if (event.target.value.length === 0) {
          this.close()
          return
        }
    }
  },
  handleOptionMouseOver (event) {
    this._selectedIndex = parseInt(event.target.dataset.index)
    this.render()
  }
})

function renderOption (props, index) {
  const { icon, title } = props
  const selected = this._selectedIndex === index
  return html`
    <li
      aria-selected=${selected}
      class='popup__option border-radius flex'
      data-index=${index}
      onmouseover=${this.handleOptionMouseOver.bind(this)}
      role='option'>
      <span>${icon}</span>
      <span class='flex flex-wrap'>
        <span class='padding-l-1'>${title}</span>
        ${renderParent(props)}
      </span>
    </li>
  `
}

function renderParent (props) {
  const { hasParent, parentPage } = props
  if (!hasParent) {
    return null
  }
  const { title } = parentPage
  return html`
    <span class='popup__option-small color-text-light flex fs-0'>
      <span class='padding-lr-1'>&mdash;</span>
      <span>${title}</span>
    </span>
  `
}
