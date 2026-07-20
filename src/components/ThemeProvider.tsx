import {type ReactNode, useLayoutEffect} from 'react'
import type {ThemeId} from '../design/themes'
import {themes, toCssVariables} from '../design/themes'

type Props = { theme: ThemeId; children: ReactNode }

export function ThemeProvider({theme, children}: Readonly<Props>) {
    useLayoutEffect(() => {
        const variables = toCssVariables(themes[theme])
        const root = document.documentElement

        root.dataset.theme = theme
        for (const [key, value] of Object.entries(variables)) {
            root.style.setProperty(key, value)
        }

        return () => {
            for (const key of Object.keys(variables)) root.style.removeProperty(key)
            delete root.dataset.theme
        }
    }, [theme])

    return <>{children}</>
}
