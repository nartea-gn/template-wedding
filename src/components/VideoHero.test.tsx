import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {VideoHero} from './VideoHero'

/** jsdom implements neither of these, so the component's two branches need stubs to be observable. */
function stubVideoApis() {
    const play = vi.fn<() => Promise<void>>(() => Promise.resolve())
    const requestFullscreen = vi.fn<() => Promise<void>>(() => Promise.resolve())
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {configurable: true, value: play})
    Object.defineProperty(Element.prototype, 'requestFullscreen', {configurable: true, value: requestFullscreen})
    return {play, requestFullscreen}
}

/** jsdom ships no matchMedia at all, so it is defined rather than spied on. */
function stubPointer(kind: 'coarse' | 'fine') {
    const matchMedia = vi.fn((query: string) => ({
        matches: query.includes(kind),
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
    }) as MediaQueryList)
    Object.defineProperty(window, 'matchMedia', {configurable: true, writable: true, value: matchMedia})
}

function renderHero() {
    render(<VideoHero src="/video.mp4" poster="/poster.avif" preload="none" aspectRatio="16 / 9"
                      label="video" playLabel="play" loadingLabel="loading" errorLabel="error"/>)
}

describe('VideoHero', () => {
    afterEach(() => {
        vi.restoreAllMocks()
        Reflect.deleteProperty(Element.prototype, 'requestFullscreen')
        Reflect.deleteProperty(window, 'matchMedia')
    })

    it('goes fullscreen on a touch screen, where the inline player is a stamp', async () => {
        const {play, requestFullscreen} = stubVideoApis()
        stubPointer('coarse')
        renderHero()

        await userEvent.click(screen.getByRole('button', {name: 'play'}))

        expect(requestFullscreen).toHaveBeenCalledTimes(1)
        expect(play).toHaveBeenCalledTimes(1)
    })

    it('stays inline on a mouse-driven browser, which already has room for the video', async () => {
        const {play, requestFullscreen} = stubVideoApis()
        stubPointer('fine')
        renderHero()

        await userEvent.click(screen.getByRole('button', {name: 'play'}))

        expect(requestFullscreen).not.toHaveBeenCalled()
        expect(play).toHaveBeenCalledTimes(1)
    })
})
