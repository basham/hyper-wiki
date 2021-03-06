export const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea'
]
  .map((el) => `${el}:not([disabled])`)
  .join(', ')

export const MAX_RESULTS = 10

export const PAGE_ICON = '📄'
export const PAGE_TITLE = 'Untitled'
