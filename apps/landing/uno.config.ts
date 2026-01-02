import {
  defineConfig,
  presetUno,
  presetIcons,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  presets: [
    presetUno({
      dark: 'class',
    }),
    presetIcons({
      scale: 1.2,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],

  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],

  theme: {
    colors: {
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      card: 'hsl(var(--card))',
      'card-foreground': 'hsl(var(--card-foreground))',
      muted: 'hsl(var(--muted))',
      'muted-foreground': 'hsl(var(--muted-foreground))',
      primary: 'hsl(var(--primary))',
      'primary-foreground': 'hsl(var(--primary-foreground))',
      secondary: 'hsl(var(--secondary))',
      'secondary-foreground': 'hsl(var(--secondary-foreground))',
      accent: 'hsl(var(--accent))',
      'accent-foreground': 'hsl(var(--accent-foreground))',
      border: 'hsl(var(--border))',
      ring: 'hsl(var(--ring))',
      destructive: 'hsl(var(--destructive))',
      success: 'hsl(var(--success))',
    },
    borderRadius: {
      DEFAULT: 'var(--radius)',
      lg: 'var(--radius)',
      md: 'calc(var(--radius) - 2px)',
      sm: 'calc(var(--radius) - 4px)',
      xl: 'calc(var(--radius) + 4px)',
      '2xl': 'calc(var(--radius) + 8px)',
    },
    fontFamily: {
      sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', 'monospace'],
    },
    boxShadow: {
      'hero': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
      'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      'glow': '0 0 40px rgba(59, 130, 246, 0.15)',
    },
  },

  shortcuts: {
    // Layout
    'container-landing': 'max-w-6xl mx-auto px-6 lg:px-8',
    'section-padding': 'py-16 md:py-24 lg:py-32',

    // Typography
    'text-balance': 'text-balance',
    'heading-1': 'text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]',
    'heading-2': 'text-3xl md:text-4xl font-semibold tracking-tight text-foreground',
    'heading-3': 'text-xl md:text-2xl font-semibold text-foreground',
    'body-large': 'text-lg md:text-xl text-muted-foreground leading-relaxed',
    'body': 'text-base text-muted-foreground leading-relaxed',
    'body-small': 'text-sm text-muted-foreground',

    // Buttons
    'btn-base': 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 border border-transparent focus-visible:outline-none focus-visible:border-border-strong disabled:pointer-events-none disabled:opacity-50',
    'btn-primary': 'btn-base bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] shadow-lg shadow-primary/25',
    'btn-secondary': 'btn-base bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border',
    'btn-outline': 'btn-base bg-transparent border border-border text-foreground hover:bg-accent hover:border-primary/50',
    'btn-ghost': 'btn-base bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent',
    'btn-lg': 'h-12 px-8 text-base rounded-xl',
    'btn-md': 'h-10 px-6 text-sm rounded-lg',
    'btn-sm': 'h-9 px-4 text-sm rounded-lg',

    // Cards
    'card-base': 'bg-card border border-border rounded-xl transition-all duration-300',
    'card-hover': 'hover:border-primary/50 hover:shadow-card-hover hover:-translate-y-0.5',
    'card-interactive': 'card-base card-hover cursor-pointer',

    // Interactive states
    'focus-ring': 'focus-visible:outline-none focus-visible:border-border-strong',

    // Utility
    'gradient-fade': 'bg-gradient-to-b from-background via-background to-transparent',
    'gradient-glow': 'bg-gradient-to-r from-primary/20 via-primary/10 to-transparent',
  },

  safelist: [
    'i-lucide-check',
    'i-lucide-chevron-down',
    'i-lucide-chevron-right',
    'i-lucide-download',
    'i-lucide-external-link',
    'i-lucide-github',
    'i-lucide-twitter',
    'i-lucide-menu',
    'i-lucide-x',
    'i-lucide-palette',
    'i-lucide-boxes',
    'i-lucide-wifi-off',
    'i-lucide-share-2',
    'i-lucide-check-square',
    'i-lucide-timer',
    'i-lucide-columns-3',
    'i-lucide-bar-chart-3',
    'i-lucide-file-text',
    'i-lucide-focus',
    'i-lucide-flame',
    'i-lucide-hash',
    'i-lucide-sticky-note',
    'i-lucide-radar',
    'i-lucide-calendar',
    'i-lucide-heart',
    'i-lucide-sparkles',
    'i-lucide-arrow-right',
    'i-lucide-play',
    'i-lucide-star',
    'i-lucide-code',
  ],
})
