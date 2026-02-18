import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { AppTheme, ThemeColors } from '@/types'

function applyTheme(theme: AppTheme) {
    const root = document.documentElement
    const colors = theme.colors as ThemeColors
    for (const [key, value] of Object.entries(colors)) {
        const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
        root.style.setProperty(cssVar, value)
    }
    root.style.setProperty('--radius', theme.radius)
    root.style.setProperty('--font-family', `'${theme.font}', system-ui, sans-serif`)
    root.setAttribute('data-theme-style', theme.style)

    if (theme.customBackground) {
        root.style.setProperty('--custom-bg', theme.customBackground)
    } else {
        root.style.removeProperty('--custom-bg')
    }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const settings = useAppStore((s) => s.settings)
    const themes = useAppStore((s) => s.themes)

    useEffect(() => {
        const theme = themes.find((t) => t.id === settings.selectedThemeId) ?? themes[0]
        if (theme) applyTheme(theme)
    }, [settings.selectedThemeId, themes])

    return <>{children}</>
}
