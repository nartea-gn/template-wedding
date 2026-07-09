import {type ReactNode, useEffect} from 'react'
import {type Theme, themes} from '../themes'

type Props = { theme: Theme; children: ReactNode }

export function ThemeProvider({theme, children}: Readonly<Props>) {
    useEffect(() => {
        const tokens = themes[theme]
        const root = document.documentElement

        // Apply all theme tokens
        for (const [key, value] of Object.entries(tokens)) {
            root.style.setProperty(key, value)
        }

        // Set data attribute for CSS selectors
        root.dataset.theme = theme
    }, [theme])

    return <>{children}</>
}
