import { defineConfig, presetUno } from 'unocss'
import transformerDirectives from '@unocss/transformer-directives'

export default defineConfig({
  presets: [
    presetUno({
      dark: 'class',
    }),
  ],

  transformers: [
    transformerDirectives(),
  ],

  theme: {
    colors: {
      border: 'hsl(var(--border) / <alpha-value>)',
      'border-strong': 'hsl(var(--border-strong) / <alpha-value>)',
      input: 'hsl(var(--input) / <alpha-value>)',
      ring: 'hsl(var(--ring) / <alpha-value>)',
      background: 'hsl(var(--background) / <alpha-value>)',
      foreground: 'hsl(var(--foreground) / <alpha-value>)',
      primary: {
        DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
        foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
      },
      secondary: {
        DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
        foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
      },
      destructive: {
        DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
        foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
      },
      success: 'hsl(var(--success) / <alpha-value>)',
      muted: {
        DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
        foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
      },
      'text-subtle': 'hsl(var(--text-subtle) / <alpha-value>)',
      accent: {
        DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
        foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
      },
      popover: {
        DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
        foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
      },
      card: {
        DEFAULT: 'hsl(var(--card) / <alpha-value>)',
        foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
      },
      widget: {
        DEFAULT: 'hsl(var(--widget) / <alpha-value>)',
        foreground: 'hsl(var(--widget-foreground) / <alpha-value>)',
        border: 'hsl(var(--widget-border) / <alpha-value>)',
      },
      overlay: 'hsl(var(--overlay) / <alpha-value>)',
    },

    fontFamily: {
      serif: 'var(--font-serif)',
      sans: 'var(--font-sans)',
    },

    borderRadius: {
      lg: 'var(--radius)',
      md: 'calc(var(--radius) - 2px)',
      sm: 'calc(var(--radius) - 4px)',
    },

    boxShadow: {
      xs: '0 1px 2px 0 rgb(0 0 0 / 0.06)',
      widget: '0 1px 2px 0 rgb(0 0 0 / 0.06)',
      'widget-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      'widget-selected': '0 0 0 2px hsl(var(--ring) / 0.4)',
    },
  },

  shortcuts: {
    // Chalk Edition: border-based focus instead of ring
    'btn-base': 'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
    'input-base': 'flex h-9 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-border-strong disabled:cursor-not-allowed disabled:opacity-50',
    // Typography
    'title-serif': 'font-serif',
  },
})
