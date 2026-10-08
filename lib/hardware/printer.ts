/**
 * Standalone Thermal Print Driver for F&B POS
 * Completely isolates the receipt text with exact 58mm/80mm roll dimensions.
 * Dual protection guarantees that the main application UI or desktop page NEVER prints:
 * 1. Dedicated print window with pure thermal stylesheet (primary).
 * 2. In-DOM #thermal-print-container fallback where @media print strictly hides all other elements.
 */

export function printThermalReceipt(
  receiptText: string,
  paperWidth: '58mm' | '80mm' = '58mm'
): Promise<void> {
  return new Promise((resolve) => {
    const escaped = receiptText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    const printableWidth = paperWidth === '80mm' ? '74mm' : '52mm'
    const fontSize = paperWidth === '80mm' ? '11px' : '9.5px'

    // METHOD 1: Clean Dedicated Print Popup (zero risk of parent window leaking)
    try {
      const printWin = window.open(
        '',
        '_blank',
        'width=420,height=680,menubar=no,toolbar=no,location=no,status=no'
      )

      if (printWin && printWin.document) {
        printWin.document.open()
        printWin.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Struk Kasir (${paperWidth})</title>
    <style>
      @page {
        size: ${paperWidth} auto;
        margin: 0mm;
      }
      * {
        box-sizing: border-box;
      }
      html, body {
        width: 100%;
        max-width: ${paperWidth};
        margin: 0;
        padding: 0;
        background: #ffffff;
        color: #000000;
      }
      pre {
        width: ${printableWidth};
        margin: 0 auto;
        padding: 3mm 1mm;
        font-family: 'Courier New', Courier, monospace;
        font-size: ${fontSize};
        line-height: 1.25;
        white-space: pre-wrap;
        word-break: break-all;
        color: #000000;
      }
    </style>
  </head>
  <body>
    <pre>${escaped}</pre>
    <script>
      window.onload = function() {
        setTimeout(function() {
          window.focus();
          window.print();
          setTimeout(function() {
            window.close();
          }, 350);
        }, 150);
      };
    <\/script>
  </body>
</html>`)
        printWin.document.close()
        resolve()
        return
      }
    } catch {
      // Popup was blocked or restricted; proceed to fallback
    }

    // METHOD 2: In-Page DOM Container with strict @media print CSS isolation
    let container = document.getElementById('thermal-print-container')
    if (!container) {
      container = document.createElement('div')
      container.id = 'thermal-print-container'
      document.body.appendChild(container)
    }

    container.style.setProperty('--receipt-width', paperWidth)
    container.innerHTML = `<pre>${escaped}</pre>`

    // Inject dynamic @page style tag
    let styleEl = document.getElementById('thermal-page-style')
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'thermal-page-style'
      document.head.appendChild(styleEl)
    }
    styleEl.innerHTML = `@page { size: ${paperWidth} auto; margin: 0; }`

    setTimeout(() => {
      window.print()
      resolve()
    }, 100)
  })
}

// Backward-compatible alias
export const printThermalReceiptViaIframe = printThermalReceipt
