# Theme System Documentation

## Overview

The Polaris Interview Agent now supports a comprehensive light and dark mode theme system that automatically adapts to user preferences and system settings.

## Features

### 🌓 Three Theme Options
- **Light Mode**: Clean, bright interface optimized for daytime use
- **Dark Mode**: Easy on the eyes, perfect for low-light environments
- **System**: Automatically follows your operating system's theme preference

### 🎨 Automatic Adaptation
- CSS variables ensure consistent theming across all components
- Smooth transitions between themes
- Persistent theme preference (saved in localStorage)
- Real-time system theme detection

### ♿ Accessibility
- High contrast ratios for both themes
- Proper focus indicators
- Screen reader friendly
- Respects system accessibility settings

## Implementation Details

### Core Components

#### ThemeContext (`src/contexts/ThemeContext.tsx`)
- Manages theme state across the application
- Handles system theme detection
- Persists user preferences
- Provides theme switching functionality

#### ThemeToggle (`src/components/ui/theme-toggle.tsx`)
- Dropdown menu for theme selection
- Animated sun/moon icons
- Accessible keyboard navigation

### CSS Variables

The theme system uses CSS custom properties defined in `src/app/globals.css`:

```css
:root {
  --background: oklch(1 0 0);        /* Light background */
  --foreground: oklch(0.145 0 0);    /* Light text */
  --card: oklch(1 0 0);              /* Light card background */
  /* ... more variables */
}

.dark {
  --background: oklch(0.145 0 0);    /* Dark background */
  --foreground: oklch(0.985 0 0);    /* Dark text */
  --card: oklch(0.205 0 0);          /* Dark card background */
  /* ... more variables */
}
```

### Usage

#### Adding Theme Support to Components

1. **Use semantic color classes**:
```tsx
<div className="bg-background text-foreground">
  <h1 className="text-foreground">Title</h1>
  <p className="text-muted-foreground">Description</p>
</div>
```

2. **Add dark mode variants**:
```tsx
<button className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  Click me
</button>
```

3. **Use the theme context**:
```tsx
import { useTheme } from '@/contexts/ThemeContext'

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>Resolved theme: {resolvedTheme}</p>
      <button onClick={() => setTheme('dark')}>Switch to Dark</button>
    </div>
  )
}
```

#### Adding the Theme Toggle

```tsx
import { ThemeToggle } from '@/components/ui/theme-toggle'

function Header() {
  return (
    <header>
      <h1>My App</h1>
      <ThemeToggle />
    </header>
  )
}
```

## Color Scheme

The theme system follows the project's color scheme defined in `COLOR-SCHEME.md`:

### Light Mode Colors
- **Primary**: Deep Blue (#1e40af)
- **Secondary**: Bright Blue (#3b82f6)
- **Accent**: Electric Blue (#06b6d4)
- **Background**: Clean White (#ffffff)
- **Text**: Dark Gray (#1f2937)

### Dark Mode Colors
- **Primary**: Light Blue (#3b82f6)
- **Secondary**: Medium Blue (#60a5fa)
- **Accent**: Cyan (#06b6d4)
- **Background**: Dark Gray (#0f172a)
- **Text**: Light Gray (#f8fafc)

## Demo Page

Visit `/theme-demo` to see the theme system in action with various UI components and examples.

## Browser Support

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## Performance

- Minimal JavaScript overhead
- CSS-only theme switching
- No layout shifts during theme changes
- Optimized for 60fps animations

## Future Enhancements

- [ ] Custom theme creation
- [ ] High contrast mode
- [ ] Reduced motion support
- [ ] Theme-aware images and icons
- [ ] Automatic theme scheduling

## Troubleshooting

### Theme not persisting
- Check if localStorage is enabled
- Verify the ThemeProvider is wrapping your app

### System theme not detected
- Ensure the media query listener is working
- Check browser support for `prefers-color-scheme`

### Styling issues
- Use semantic color classes instead of hardcoded colors
- Test both themes during development
- Check contrast ratios for accessibility
