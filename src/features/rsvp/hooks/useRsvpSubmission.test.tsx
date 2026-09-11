import {act, renderHook, waitFor} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'
import type {RsvpRepository} from '../domain/RsvpRepository'
import type {RsvpSubmission} from '../domain/RsvpSubmission'
import {RsvpAmbiguousNameError, RsvpNameTakenError} from '../domain/RsvpNameTakenError'
import {useRsvpSubmission} from './useRsvpSubmission'

const submission: RsvpSubmission = {
    invitationId: 'gala-y-valentin',
    formId: 'wedding-rsvp',
    formVersion: 4,
    locale: 'es',
    answers: {fullName: 'Ana López', attending: true, songRequest: 'la primera'},
}

const repositoryWith = (submit: RsvpRepository['submit']) => ({submit} as RsvpRepository)

describe('useRsvpSubmission', () => {
    it('leaves a submission that never collided without a resolution to report', async () => {
        const submit = vi.fn().mockResolvedValue(undefined)
        const {result} = renderHook(() => useRsvpSubmission(repositoryWith(submit)))

        await act(() => result.current.submit(submission))

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(result.current.resolvedAs).toBeNull()
    })

    it('turns a taken name into a question, not into a failure', async () => {
        const submit = vi.fn().mockRejectedValue(new RsvpNameTakenError())
        const {result} = renderHook(() => useRsvpSubmission(repositoryWith(submit)))

        await act(() => result.current.submit(submission))

        await waitFor(() => expect(result.current.isNameTaken).toBe(true))
        // Lo que el invitado veria si esto fuese un error: "hubo un error al guardar tu
        // asistencia", sobre una respuesta que no ha fallado sino que espera una aclaracion.
        expect(result.current.isError).toBe(false)
        expect(result.current.error).toBeNull()
        expect(result.current.isSuccess).toBe(false)
    })

    it('sends the same answers again with the intent the guest states', async () => {
        const submit = vi.fn()
            .mockRejectedValueOnce(new RsvpNameTakenError())
            .mockResolvedValueOnce(undefined)
        const {result} = renderHook(() => useRsvpSubmission(repositoryWith(submit)))

        await act(() => result.current.submit(submission))
        await waitFor(() => expect(result.current.isNameTaken).toBe(true))

        await act(() => result.current.resolveIdentity('namesake'))

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(submit).toHaveBeenNthCalledWith(2, {...submission, intent: 'namesake'})
        expect(result.current.isNameTaken).toBe(false)
        // La pantalla de gracias lo necesita: es el unico invitado que no podra corregirse solo.
        expect(result.current.resolvedAs).toBe('namesake')
    })

    it('keeps a correction a correction when the guest says it is the same person', async () => {
        const submit = vi.fn()
            .mockRejectedValueOnce(new RsvpNameTakenError())
            .mockResolvedValueOnce(undefined)
        const {result} = renderHook(() => useRsvpSubmission(repositoryWith(submit)))

        await act(() => result.current.submit(submission))
        await waitFor(() => expect(result.current.isNameTaken).toBe(true))

        await act(() => result.current.resolveIdentity('correction'))

        expect(submit).toHaveBeenNthCalledWith(2, {...submission, intent: 'correction'})
        expect(result.current.resolvedAs).toBe('correction')
    })

    it('separates a name that cannot be attributed from one that simply answered', async () => {
        const submit = vi.fn().mockRejectedValue(new RsvpAmbiguousNameError())
        const {result} = renderHook(() => useRsvpSubmission(repositoryWith(submit)))

        await act(() => result.current.submit(submission))

        await waitFor(() => expect(result.current.isNameAmbiguous).toBe(true))
        expect(result.current.isNameTaken).toBe(false)
        expect(result.current.isError).toBe(false)
    })

    // `FormEngine` borra el borrador en cuanto `onSubmit` resuelve, y la primera llamada resuelve
    // porque la pregunta no es un fallo. Si la pantalla de la pregunta se cayera aqui, el invitado
    // volveria a un formulario remontado desde un borrador que ya no existe.
    it('holds the question when the retry fails, instead of dropping the guest into an empty form', async () => {
        const submit = vi.fn()
            .mockRejectedValueOnce(new RsvpNameTakenError())
            .mockRejectedValueOnce(new Error('network down'))
            .mockResolvedValueOnce(undefined)
        const {result} = renderHook(() => useRsvpSubmission(repositoryWith(submit)))

        await act(() => result.current.submit(submission))
        await waitFor(() => expect(result.current.isNameTaken).toBe(true))

        await act(() => result.current.resolveIdentity('namesake'))

        await waitFor(() => expect(result.current.isError).toBe(true))
        expect(result.current.isNameTaken).toBe(true)

        // Y las respuestas siguen ahi: reintentar es un clic, no volver a rellenar el formulario.
        await act(() => result.current.resolveIdentity('namesake'))

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(submit).toHaveBeenNthCalledWith(3, {...submission, intent: 'namesake'})
    })

    it('still reports a real failure as one', async () => {
        const submit = vi.fn().mockRejectedValue(new Error('network down'))
        const {result} = renderHook(() => useRsvpSubmission(repositoryWith(submit)))

        await act(() => result.current.submit(submission))

        await waitFor(() => expect(result.current.isError).toBe(true))
        expect(result.current.isNameTaken).toBe(false)
        expect(result.current.isNameAmbiguous).toBe(false)
    })
})
