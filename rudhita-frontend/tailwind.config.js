/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Core palette — high contrast ink on warm paper, with an electric punch.
        ink:    'hsl(var(--ink) / <alpha-value>)',        // near-black, primary text/buttons
        paper:  'hsl(var(--paper) / <alpha-value>)',      // warm off-white background
        punch:  'hsl(var(--punch) / <alpha-value>)',      // electric vermilion accent
        clay:   'hsl(var(--clay) / <alpha-value>)',       // terracotta secondary
        sand:   'hsl(var(--sand) / <alpha-value>)',       // muted card surface
        line:   'hsl(var(--line) / <alpha-value>)',       // hairline borders
        muted:  'hsl(var(--muted) / <alpha-value>)',      // secondary text
        // shadcn-style semantic aliases (so UI primitives read naturally)
        background: 'hsl(var(--paper) / <alpha-value>)',
        foreground: 'hsl(var(--ink) / <alpha-value>)',
        primary:    'hsl(var(--ink) / <alpha-value>)',
        accent:     'hsl(var(--punch) / <alpha-value>)',
        destructive:'hsl(var(--destructive) / <alpha-value>)',
        success:    'hsl(var(--success) / <alpha-value>)',
      },
      fontFamily: {
        // Distinctive pairing: a characterful display serif + a strong grotesque.
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans:    ['"Archivo"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        brutal:    '4px 4px 0 0 hsl(var(--ink))',
        brutalLg:  '7px 7px 0 0 hsl(var(--ink))',
        brutalPunch: '5px 5px 0 0 hsl(var(--punch))',
      },
      keyframes: {
        'fade-up':   { '0%': { opacity: 0, transform: 'translateY(12px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'scale-in':  { '0%': { opacity: 0, transform: 'scale(0.96)' },      '100%': { opacity: 1, transform: 'scale(1)' } },
        'marquee':   { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        'spin-slow': { 'to': { transform: 'rotate(360deg)' } },
      },
      animation: {
        'fade-up':  'fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.16,1,0.3,1) both',
        'marquee':  'marquee 22s linear infinite',
        'spin-slow':'spin-slow 0.8s linear infinite',
      },
    },
  },
  plugins: [],
};
