import { createHighlighter, type Highlighter } from 'shiki'

let highlighter: Highlighter | null = null
let highlighterPromise: Promise<Highlighter> | null = null

async function getHighlighter(): Promise<Highlighter> {
  if (highlighter) return highlighter

  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark'],
      langs: ['typescript', 'javascript', 'vue', 'json'],
    })
  }

  highlighter = await highlighterPromise
  return highlighter
}

export function useShiki() {
  const highlighted = ref<string>('')
  const isLoading = ref(true)

  async function highlight(code: string, lang: string = 'typescript') {
    isLoading.value = true
    try {
      const hl = await getHighlighter()
      highlighted.value = hl.codeToHtml(code, {
        lang,
        theme: 'github-dark',
      })
    } catch (error) {
      console.error('Failed to highlight code:', error)
      // Fallback to plain text
      highlighted.value = `<pre><code>${escapeHtml(code)}</code></pre>`
    } finally {
      isLoading.value = false
    }
  }

  return {
    highlighted,
    isLoading,
    highlight,
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
