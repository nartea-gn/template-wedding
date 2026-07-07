import {type ReactNode, useEffect} from 'react'
import {type Theme, themes} from '../themes'

type Props = { theme: Theme; children: ReactNode }

export function ThemeProvider({theme, children}: Readonly<Props>) {
    useEffect(() => {
        const tokens = themes[theme]
        for (const [key, value] of Object.entries(tokens)) {
            document.documentElement.style.setProperty(key, value)
        }
        document.documentElement.dataset.theme = theme
    }, [theme])

    return <>{children}</>
}
