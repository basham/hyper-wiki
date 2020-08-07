import { css, define } from '../web_modules/uce.js'
import { className } from '../util/dom.js'

const SPRITES = '/.ui/icons.svg'
const NAME = 'hw-icon'
const cn = className(NAME)

define('hw-icon', {
  style: () => css`
    .${cn()} {
      --icon-size: var(--size-2);
      display: flex;
    }

    .${cn('svg')} {
      fill: none;
      height: var(--icon-size);
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: calc(2rem/16);
      width: var(--icon-size);
    }
  `,
  init () {
    this.classList.add(cn())
    this.dispatchEvent(new CustomEvent('loading', { bubbles: true }))
    const href = `${SPRITES}#${this.props.name}`
    this.html`<svg aria-hidden='true' class=${cn('svg')}><use href=${href}/></svg>`
    this.dispatchEvent(new CustomEvent('loaded', { bubbles: true }))
  }
})
