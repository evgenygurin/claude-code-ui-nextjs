# Custom Themes and Styling

This guide shows how to customize the appearance of Claude Code UI with custom themes, colors, and styling.

## Theme System Overview

Claude Code UI uses a flexible theming system built on:

- **CSS Custom Properties** - For dynamic color switching
- **Tailwind CSS** - For utility-first styling
- **shadcn/ui** - For consistent component styling
- **Dark/Light Mode** - Built-in theme switching

## Basic Theme Customization

### 1. Modify CSS Variables

Edit `app/globals.css` to customize the color palette:

```css
:root {
  /* Light theme */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}

.dark {
  /* Dark theme */
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 84% 4.9%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 94.1%;
}
```

### 2. Custom Brand Colors

Create a brand-specific theme:

```css
/* Custom brand theme */
.theme-brand {
  --primary: 142 76% 36%;        /* Green primary */
  --primary-foreground: 0 0% 100%;
  --secondary: 142 35% 90%;
  --accent: 142 76% 46%;
  --border: 142 30% 85%;
  --ring: 142 76% 36%;
}

/* Purple theme */
.theme-purple {
  --primary: 262 83% 58%;        /* Purple primary */
  --primary-foreground: 210 40% 98%;
  --secondary: 262 30% 90%;
  --accent: 262 83% 68%;
  --border: 262 30% 85%;
  --ring: 262 83% 58%;
}
```

### 3. Theme Provider Component

Create a theme provider to manage theme switching:

```typescript
// components/providers/theme-provider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'brand' | 'purple';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const themes: Theme[] = ['light', 'dark', 'brand', 'purple'];

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && themes.includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    root.className = root.className.replace(/theme-\w+/g, '');
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme !== 'light') {
      root.classList.add(`theme-${theme}`);
    }

    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

### 4. Theme Switcher Component

```typescript
// components/ui/theme-switcher.tsx
'use client';

import { useTheme } from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Palette, Sun, Moon, Sparkles } from 'lucide-react';

export function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();

  const getThemeIcon = (themeName: string) => {
    switch (themeName) {
      case 'light': return <Sun className="h-4 w-4" />;
      case 'dark': return <Moon className="h-4 w-4" />;
      case 'brand': return <Sparkles className="h-4 w-4" />;
      case 'purple': return <Palette className="h-4 w-4" />;
      default: return <Palette className="h-4 w-4" />;
    }
  };

  const getThemeLabel = (themeName: string) => {
    return themeName.charAt(0).toUpperCase() + themeName.slice(1);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {getThemeIcon(theme)}
          <span className="ml-2 hidden sm:inline">
            {getThemeLabel(theme)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((themeName) => (
          <DropdownMenuItem
            key={themeName}
            onClick={() => setTheme(themeName)}
            className={theme === themeName ? 'bg-accent' : ''}
          >
            {getThemeIcon(themeName)}
            <span className="ml-2">{getThemeLabel(themeName)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## Advanced Customization

### 1. Custom Component Styles

Override specific component styles:

```css
/* Custom terminal styling */
.terminal-custom {
  background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
  border: 1px solid #404040;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.terminal-custom .terminal-line {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  line-height: 1.4;
}

/* Custom chat interface */
.chat-interface-custom {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.dark .chat-interface-custom {
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Custom sidebar */
.sidebar-custom {
  background: linear-gradient(180deg, 
    hsl(var(--background)) 0%, 
    hsl(var(--muted)) 100%
  );
}
```

### 2. Dynamic Theme Generation

Create themes programmatically:

```typescript
// lib/theme-generator.ts
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
}

export function generateTheme(baseColor: string): ThemeColors {
  const hsl = hexToHsl(baseColor);
  
  return {
    primary: `${hsl.h} ${hsl.s}% ${hsl.l}%`,
    secondary: `${hsl.h} ${Math.max(hsl.s - 30, 10)}% ${Math.min(hsl.l + 40, 95)}%`,
    accent: `${hsl.h} ${hsl.s}% ${Math.min(hsl.l + 10, 90)}%`,
    background: `0 0% 100%`,
    foreground: `222.2 84% 4.9%`
  };
}

export function applyTheme(colors: ThemeColors) {
  const root = document.documentElement;
  
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--secondary', colors.secondary);
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--background', colors.background);
  root.style.setProperty('--foreground', colors.foreground);
}

function hexToHsl(hex: string) {
  // Convert hex to HSL
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}
```

### 3. Theme Persistence

Save and load custom themes:

```typescript
// lib/theme-storage.ts
export interface CustomTheme {
  id: string;
  name: string;
  colors: ThemeColors;
  created: string;
}

export class ThemeStorage {
  private readonly storageKey = 'claude-code-ui-themes';

  saveTheme(theme: CustomTheme): void {
    const themes = this.getThemes();
    const existingIndex = themes.findIndex(t => t.id === theme.id);
    
    if (existingIndex >= 0) {
      themes[existingIndex] = theme;
    } else {
      themes.push(theme);
    }
    
    localStorage.setItem(this.storageKey, JSON.stringify(themes));
  }

  getThemes(): CustomTheme[] {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  deleteTheme(id: string): void {
    const themes = this.getThemes().filter(t => t.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(themes));
  }

  exportThemes(): string {
    return JSON.stringify(this.getThemes(), null, 2);
  }

  importThemes(json: string): void {
    try {
      const themes = JSON.parse(json);
      localStorage.setItem(this.storageKey, JSON.stringify(themes));
    } catch (error) {
      throw new Error('Invalid theme file format');
    }
  }
}
```

### 4. Color Picker Component

```typescript
// components/ui/color-picker.tsx
'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { generateTheme, applyTheme } from '@/lib/theme-generator';

export function ColorPicker() {
  const [color, setColor] = useState('#3b82f6');
  const [themeName, setThemeName] = useState('');

  const previewTheme = (color: string) => {
    const theme = generateTheme(color);
    applyTheme(theme);
  };

  const saveTheme = () => {
    if (!themeName) return;
    
    const theme = {
      id: Date.now().toString(),
      name: themeName,
      colors: generateTheme(color),
      created: new Date().toISOString()
    };
    
    // Save theme logic here
    console.log('Saving theme:', theme);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold">Create Custom Theme</h3>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Primary Color</label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              previewTheme(e.target.value);
            }}
            className="w-16 h-10 p-1 border rounded"
          />
          <Input
            type="text"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              previewTheme(e.target.value);
            }}
            placeholder="#3b82f6"
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Theme Name</label>
        <Input
          value={themeName}
          onChange={(e) => setThemeName(e.target.value)}
          placeholder="My Custom Theme"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={saveTheme} disabled={!themeName}>
          Save Theme
        </Button>
        <Button variant="outline" onClick={() => previewTheme(color)}>
          Preview
        </Button>
      </div>
    </div>
  );
}
```

## Predefined Theme Examples

### High Contrast Theme

```css
.theme-high-contrast {
  --background: 0 0% 100%;
  --foreground: 0 0% 0%;
  --primary: 0 0% 0%;
  --primary-foreground: 0 0% 100%;
  --secondary: 0 0% 90%;
  --secondary-foreground: 0 0% 0%;
  --border: 0 0% 70%;
  --accent: 0 0% 85%;
  --accent-foreground: 0 0% 0%;
}

.dark.theme-high-contrast {
  --background: 0 0% 0%;
  --foreground: 0 0% 100%;
  --primary: 0 0% 100%;
  --primary-foreground: 0 0% 0%;
  --secondary: 0 0% 10%;
  --secondary-foreground: 0 0% 100%;
  --border: 0 0% 30%;
  --accent: 0 0% 15%;
  --accent-foreground: 0 0% 100%;
}
```

### Ocean Theme

```css
.theme-ocean {
  --primary: 199 89% 48%;        /* Ocean blue */
  --primary-foreground: 0 0% 100%;
  --secondary: 199 20% 92%;
  --accent: 199 89% 58%;
  --background: 199 20% 98%;
  --foreground: 199 20% 10%;
  --border: 199 20% 85%;
  --muted: 199 20% 95%;
  --muted-foreground: 199 20% 45%;
}
```

### Sunset Theme

```css
.theme-sunset {
  --primary: 14 91% 60%;         /* Orange */
  --primary-foreground: 0 0% 100%;
  --secondary: 14 30% 92%;
  --accent: 14 91% 70%;
  --background: 14 30% 98%;
  --foreground: 14 30% 10%;
  --border: 14 30% 85%;
  --muted: 14 30% 95%;
  --muted-foreground: 14 30% 45%;
}
```

## Integration with Components

### Apply themes to specific components:

```typescript
// In your dashboard component
export function Dashboard() {
  const { theme } = useTheme();
  
  return (
    <div className={cn(
      "dashboard-container",
      theme === 'ocean' && "theme-ocean",
      theme === 'sunset' && "theme-sunset"
    )}>
      {/* Dashboard content */}
    </div>
  );
}
```

## Best Practices

1. **Consistency** - Maintain consistent color relationships across themes
2. **Accessibility** - Ensure sufficient contrast ratios (4.5:1 minimum)
3. **Performance** - Use CSS custom properties for efficient theme switching
4. **Testing** - Test themes across all components and states
5. **Documentation** - Document theme variables and their purposes

---

With this theming system, you can create a fully customized Claude Code UI that matches your brand or personal preferences.
