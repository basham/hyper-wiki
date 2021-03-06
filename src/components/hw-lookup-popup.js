import cuid from '../web_modules/cuid.js'
import { css, define, html } from '../web_modules/uce.js'
import { FOCUSABLE_ELEMENTS, MAX_RESULTS } from '../constants.js'
import { className } from '../util/dom.js'
import { getPages } from '../util/page.js'

const NAME = 'hw-lookup-popup'
const cn = className(NAME)

define(NAME, {
  style: () => css`
    .${cn('popup')} {
      height: 100vh;
      left: 0;
      overflow: auto;
      position: fixed;
      top: 0;
      width: 100vw;
      z-index: 1;
    }

    .${cn('form')} {
      background-color: var(--color-white);
      box-shadow:
        0 var(--px-1) 0 0 var(--color-black-2),
        0 var(--size-1) var(--size-2) 0 var(--color-shadow-1);
      margin: 0 auto;
      max-width: 40rem;
    }

    .${cn('icon')} {
      --icon-size: var(--size-3);
      left: var(--size-1);
      position: absolute;
      top: var(--size-1);
    }

    .${cn('option')} {
      line-height: var(--px-20);
      padding: var(--px-6) var(--size-2);
    }

    .${cn('option[aria-selected="true"]')} {
      background-color: var(--color-ix);
      color: var(--color-white);
      cursor: pointer;
    }

    .${cn('option[aria-selected="true"]')} .${cn('option-small')} {
      color: var(--color-white);
    }

    .${cn('empty')} {
      padding: var(--size-1) var(--size-1) var(--size-1) var(--size-6);
    }
  `,
  init () {
    this._isOpen = false
    const id = cuid()
    this._ids = {
      id,
      backdropId: `${id}-backdrop`,
      inputId: `${id}-input`,
      labelId: `${id}-label`,
      listboxId: `${id}-listbox`
    }
  },
  async open (options) {
    if (this.isOpen) {
      return
    }
    const { label = '' } = options
    this._label = label
    this._isOpen = true
    this._activeElement = document.activeElement
    document.body.style.overflow = 'hidden'

    const pages = await getPages()
    this._allOptions = pages.active.map((page) =>
      ({ ...page, hasParent: false, parentPage: null })
    )
    this.setOptions(this._allOptions)
    document.getElementById(this._ids.inputId).focus()
    return new Promise((function (resolve, reject) {
      this._resolve = resolve
      this._reject = reject
    }).bind(this))
  },
  resolve () {
    const selectedOption = this.getSelectedOption()
    if (selectedOption) {
      this.exit()
      this._resolve(selectedOption.path)
    }
    else {
      this.cancel()
    }
  },
  cancel () {
    this.exit()
    this._reject('No value selected')
  },
  cancelByContainer (event) {
    const backdrop = document.getElementById(this._ids.backdropId)
    if (event.target === backdrop) {
      this.cancel()
    }
  },
  exit () {
    if (!this._isOpen) {
      return
    }
    this._isOpen = false
    this.html`${null}`
    document.body.style.overflow = ''
    this._activeElement.focus()
  },
  render () {
    const { _ids, _label } = this
    const { backdropId, inputId, labelId, listboxId } = _ids
    const selectedOption = this.getSelectedOption()
    const selectedId = selectedOption ? selectedOption.id : null
    this.html`
      <div
        aria-labelledby=${labelId}
        class=${cn('popup')}
        id=${backdropId}
        onclick=${this.cancelByContainer.bind(this)}
        role='dialog'>
        <form
          class=${cn('form', 'padding-1')}
          onkeydown=${this.handleTrapFocus.bind(this)}
          onsubmit=${this.handleFormSubmit.bind(this)}
          tabindex='-1'>
          <div class='flex'>
            <h1 class='flex-grow fs-2 lh-3 padding-1'>
              <label
                for=${inputId}
                id=${labelId}>
                ${_label}
              </label>
            </h1>
            <div class='flex padding-1'>
              <button
                aria-label='Cancel'
                class='button-icon'
                onclick=${this.cancel.bind(this)}
                type='button'>
                <hw-icon name='x' />
              </button>
            </div>
          </div>
          <div
            aria-expanded=${this._hasOptions}
            aria-haspopup='listbox'
            aria-owns=${listboxId}
            class='padding-1 pos-rel'
            role='combobox'>
            <hw-icon
              class=${cn('icon', 'color-text-light padding-1')}
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
            .hidden=${!this._hasOptions}
            id=${listboxId}
            role='listbox'>
            ${this._options.map(renderOption.bind(this))}
          </ul>
          <div
            class=${cn('empty', 'lh-3')}
            .hidden=${this._hasOptions}>
            No results
          </div>
        </form>
      </div>
    `
  },
  setOptions (options) {
    this._options = options
    this._optionsCount = this._options.length
    this._hasOptions = this._optionsCount > 0
    this._selectedIndex = this._hasOptions ? 0 : -1
    this.render()
  },
  getSelectedOption () {
    const i = this._selectedIndex
    return i > -1 ? this._options[i] : null
  },
  handleTrapFocus (event) {
    if (event.key !== 'Tab') {
      return
    }

    const focusableEls = this.querySelectorAll(FOCUSABLE_ELEMENTS)
    const first = focusableEls[0]
    const last = focusableEls[focusableEls.length - 1]

    if (event.shiftKey) {
      if (document.activeElement === first) {
        last.focus()
        event.preventDefault()
      }
    } else {
      if (document.activeElement === last) {
        first.focus()
        event.preventDefault()
      }
    }
  },
  handleFormSubmit (event) {
    event.preventDefault()
    this.resolve()
  },
  handleInputChange (event) {
    const { value } = event.target
    const options = this._allOptions
      .filter(({ title }) =>
        title.toLowerCase().indexOf(value.trim().toLowerCase()) !== -1
      )
      .slice(0, MAX_RESULTS)
    this.setOptions(options)
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
      case 'Escape':
        if (event.target.value.length === 0) {
          this.cancel()
          return
        }
    }
  },
  handleOptionClick () {
    this.resolve()
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
      class=${cn('option', 'border-radius flex')}
      data-index=${index}
      onclick=${this.handleOptionClick.bind(this)}
      onmouseover=${this.handleOptionMouseOver.bind(this)}
      role='option'>
      <span class='no-pointer-events'>${icon}</span>
      <span class='flex flex-wrap no-pointer-events'>
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
    <span class=${cn('option-small', 'color-text-light flex fs-0')}>
      <span class='padding-lr-1'>&mdash;</span>
      <span>${title}</span>
    </span>
  `
}
