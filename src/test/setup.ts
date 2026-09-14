import {afterEach} from 'vitest'

/*
 * EL ENTORNO DE CADA FICHERO DECIDE QUE HACE FALTA MONTAR AQUI
 *
 * `setupFiles` corre para todos, y jsdom era el entorno de todos: 32 entornos por pasada, el 63 %
 * del tiempo medido de la suite, para 18 ficheros que no tocan el DOM en ninguna aserción. Esos
 * declaran `// @vitest-environment node` en su cabecera, y ahí no hay `document` que limpiar ni
 * matchers de DOM que registrar -- importarlos reventaría antes de la primera prueba.
 *
 * No se toca el pool: `vmThreads` es más rápido todavía y cuelga el chunk perezoso de `/rsvp`
 * (ver la nota de `vitest.config.ts`). Esto reduce el número de entornos, no la forma de crearlos.
 */
if (typeof document !== 'undefined') {
    await import('@testing-library/jest-dom/vitest')
    const {cleanup} = await import('@testing-library/react')

    afterEach(() => {
        cleanup()
        localStorage.clear()
    })
}
