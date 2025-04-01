import { fontFamily } from 'tailwindcss/defaultTheme';
import tailwindcssAnimate from 'tailwindcss-animate';
import tailwindTypography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./pages/**/*.{ts,tsx}', './app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'aurora-slow': {
          '0%': { transform: 'translate(0, 0) scale(1) rotate(0deg)' },
          '20%': { transform: 'translate(20px, 10px) scale(1.05) rotate(2deg)' },
          '40%': { transform: 'translate(-15px, 25px) scale(1.1) rotate(-2deg)' },
          '60%': { transform: 'translate(-25px, -10px) scale(1.05) rotate(-1deg)' },
          '80%': { transform: 'translate(15px, -25px) scale(0.95) rotate(1deg)' },
          '100%': { transform: 'translate(0, 0) scale(1) rotate(0deg)' },
        },
        'aurora-medium': {
          '0%': { transform: 'translate(0, 0) scale(1) rotate(0deg)' },
          '25%': { transform: 'translate(-25px, 20px) scale(1.08) rotate(-3deg)' },
          '50%': { transform: 'translate(20px, -30px) scale(0.95) rotate(2deg)' },
          '75%': { transform: 'translate(25px, 15px) scale(1.05) rotate(1deg)' },
          '100%': { transform: 'translate(0, 0) scale(1) rotate(0deg)' },
        },
        'aurora-fast': {
          '0%': { transform: 'translate(0, 0) scale(1) rotate(0deg)' },
          '15%': { transform: 'translate(15px, -15px) scale(1.05) rotate(1deg)' },
          '30%': { transform: 'translate(35px, 10px) scale(1.1) rotate(3deg)' },
          '45%': { transform: 'translate(15px, 35px) scale(1) rotate(2deg)' },
          '60%': { transform: 'translate(-25px, 25px) scale(0.98) rotate(-2deg)' },
          '75%': { transform: 'translate(-35px, -10px) scale(0.95) rotate(-3deg)' },
          '90%': { transform: 'translate(-15px, -30px) scale(0.98) rotate(-1deg)' },
          '100%': { transform: 'translate(0, 0) scale(1) rotate(0deg)' },
        },
        'pulse-slow': {
          '0%': { opacity: '0.25', transform: 'scale(0.95)', filter: 'blur(12px)' },
          '50%': { opacity: '0.5', transform: 'scale(1.1)', filter: 'blur(15px)' },
          '100%': { opacity: '0.25', transform: 'scale(0.95)', filter: 'blur(12px)' },
        },
        'pulse-medium': {
          '0%': { opacity: '0.2', transform: 'scale(0.9)', filter: 'blur(12px)' },
          '50%': { opacity: '0.4', transform: 'scale(1.15)', filter: 'blur(18px)' },
          '100%': { opacity: '0.2', transform: 'scale(0.9)', filter: 'blur(12px)' },
        },
        'float-slow': {
          '0%': { transform: 'translateY(0) translateX(0)' },
          '25%': { transform: 'translateY(-15px) translateX(10px)' },
          '50%': { transform: 'translateY(0) translateX(15px)' },
          '75%': { transform: 'translateY(15px) translateX(5px)' },
          '100%': { transform: 'translateY(0) translateX(0)' },
        },
        'float-medium': {
          '0%': { transform: 'translateY(0) translateX(0)' },
          '33%': { transform: 'translateY(-20px) translateX(-15px)' },
          '66%': { transform: 'translateY(15px) translateX(20px)' },
          '100%': { transform: 'translateY(0) translateX(0)' },
        },
        'float-fast': {
          '0%': { transform: 'translateY(0) translateX(0) scale(1)' },
          '20%': { transform: 'translateY(-15px) translateX(10px) scale(1.1)' },
          '40%': { transform: 'translateY(-25px) translateX(-5px) scale(1)' },
          '60%': { transform: 'translateY(5px) translateX(-15px) scale(0.95)' },
          '80%': { transform: 'translateY(20px) translateX(10px) scale(1.05)' },
          '100%': { transform: 'translateY(0) translateX(0) scale(1)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'aurora-slow': 'aurora-slow 8s ease-in-out infinite',
        'aurora-medium': 'aurora-medium 6s ease-in-out infinite',
        'aurora-fast': 'aurora-fast 4s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
        'pulse-medium': 'pulse-medium 3s ease-in-out infinite',
        'float-slow': 'float-slow 3s ease-in-out infinite',
        'float-medium': 'float-medium 2s ease-in-out infinite',
        'float-fast': 'float-fast 1.5s ease-in-out infinite',
      },
      typography: {
        DEFAULT: {
          css: {
            color: 'hsl(var(--foreground))',
            a: {
              color: 'hsl(var(--primary))',
              '&:hover': {
                color: 'hsl(var(--primary) / 0.8)',
              },
            },
            'h1,h2,h3,h4,h5,h6': {
              color: 'hsl(var(--foreground))',
              fontWeight: '600',
            },
            code: {
              color: 'hsl(var(--foreground))',
              backgroundColor: 'hsl(var(--muted) / 0.4)',
              borderRadius: '0.25rem',
              padding: '0.15rem 0.3rem',
            },
            pre: {
              backgroundColor: 'hsl(var(--card))',
              padding: 0,
              overflow: 'auto',
            },
            blockquote: {
              color: 'hsl(var(--foreground) / 0.8)',
              borderLeftColor: 'hsl(var(--primary) / 0.2)',
            },
            hr: {
              borderColor: 'hsl(var(--border))',
            },
            strong: {
              color: 'hsl(var(--foreground))',
              fontWeight: '600',
            },
            li: {
              marginTop: '0.25em',
              marginBottom: '0.25em',
            },
            ul: {
              listStyleType: 'disc',
            },
            ol: {
              listStyleType: 'decimal',
            },
            table: {
              width: '100%',
              borderCollapse: 'collapse',
              overflow: 'hidden',
              margin: '1em 0',
            },
            thead: {
              backgroundColor: 'hsl(var(--muted) / 0.5)',
              borderBottom: '2px solid hsl(var(--border))',
            },
            'thead th': {
              verticalAlign: 'bottom',
              fontWeight: '600',
              color: 'hsl(var(--foreground))',
              textAlign: 'left',
              padding: '0.75rem',
            },
            'tbody tr': {
              borderBottom: '1px solid hsl(var(--border))',
              '&:last-child': {
                borderBottom: 'none',
              },
            },
            'tbody td': {
              padding: '0.75rem',
              verticalAlign: 'top',
            },
            'tbody tr:nth-child(even)': {
              backgroundColor: 'hsl(var(--muted) / 0.2)',
            },
          },
        },
        dark: {
          css: {
            color: 'hsl(var(--foreground))',
            a: {
              color: 'hsl(var(--primary))',
            },
            'h1,h2,h3,h4,h5,h6': {
              color: 'hsl(var(--foreground))',
            },
            code: {
              color: 'hsl(var(--foreground))',
              backgroundColor: 'hsl(var(--muted) / 0.4)',
            },
            blockquote: {
              color: 'hsl(var(--foreground) / 0.8)',
              borderLeftColor: 'hsl(var(--primary) / 0.2)',
            },
            thead: {
              backgroundColor: 'hsl(var(--muted) / 0.8)',
              borderBottom: '2px solid hsl(var(--border))',
            },
            'tbody tr:nth-child(even)': {
              backgroundColor: 'hsl(var(--muted) / 0.3)',
            },
          },
        },
      },
    },
  },
  plugins: [tailwindcssAnimate, tailwindTypography],
};
