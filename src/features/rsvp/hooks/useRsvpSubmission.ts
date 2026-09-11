import {useState} from 'react'
import type {RsvpRepository} from '../domain/RsvpRepository'
import type {RsvpSubmission, RsvpSubmissionIntent} from '../domain/RsvpSubmission'
import {submitRsvp} from '../application/submitRsvp'
import {RsvpClosedError} from '../domain/RsvpClosedError'
import {RsvpAmbiguousNameError, RsvpNameTakenError} from '../domain/RsvpNameTakenError'

export function useRsvpSubmission(repository: RsvpRepository) {
    const [isLoading, setIsLoading] = useState(false), [isSuccess, setIsSuccess] = useState(false), [error, setError] = useState<Error | null>(null)
    const [isClosed, setIsClosed] = useState(false)
    /**
     * The two answers the database gives when a name is already taken.
     *
     * Neither sets `error`: one is a question for the guest and the other is an instruction to
     * write to the couple, and showing "there was an error saving your attendance" over either
     * would tell them something false about what just happened.
     */
    const [isNameTaken, setIsNameTaken] = useState(false)
    const [isNameAmbiguous, setIsNameAmbiguous] = useState(false)
    /** Kept so the guest's answers survive the question and are sent again unchanged. */
    const [pending, setPending] = useState<RsvpSubmission | null>(null)
    /**
     * How the guest resolved a collision, once the submission went through.
     *
     * The thank-you screen needs it: a guest who declared themselves a namesake is the only one
     * who cannot come back and correct their own answer -- with two rows under one name the
     * database refuses to guess -- and they should leave knowing it rather than find out weeks
     * later, on the screen that tells them to write instead.
     */
    const [resolvedAs, setResolvedAs] = useState<RsvpSubmissionIntent | null>(null)

    const send = async (submission: RsvpSubmission) => {
        setIsLoading(true);
        setIsSuccess(false);
        setError(null);
        setIsClosed(false)
        setIsNameTaken(false);
        setIsNameAmbiguous(false)
        try {
            await submitRsvp(repository, submission);
            setPending(null)
            setResolvedAs(submission.intent ?? null)
            setIsSuccess(true)
        } catch (reason) {
            if (reason instanceof RsvpNameTakenError) {
                setPending(submission)
                setIsNameTaken(true)
                return
            }
            if (reason instanceof RsvpAmbiguousNameError) {
                setIsNameAmbiguous(true)
                return
            }
            if (reason instanceof RsvpClosedError) setIsClosed(true)
            /*
             * Un fallo de red al responder la pregunta no devuelve al invitado a un formulario
             * vacio.
             *
             * `FormEngine` borra el borrador en cuanto `onSubmit` resuelve, y este hook resuelve
             * la primera vez: captura `RsvpNameTakenError` y no lo relanza, porque no es un
             * fallo. Si el reenvio con intencion cae y la pantalla de la pregunta desaparece, lo
             * que vuelve es el formulario remontado desde un borrador que ya no existe -- el
             * paso uno en blanco con una caja de error, y todo lo escrito perdido de la vista.
             * Sosteniendo la pregunta, `pending` conserva las respuestas y el reintento es un
             * clic.
             */
            else if (submission.intent) setIsNameTaken(true)
            setError(reason instanceof Error ? reason : new Error('Unknown error'))
        } finally {
            setIsLoading(false)
        }
    }

    /** Sends the same answers again, now saying which of the two people the guest is. */
    const resolveIdentity = async (intent: RsvpSubmissionIntent) => {
        if (!pending) return
        await send({...pending, intent})
    }

    return {
        submit: send,
        resolveIdentity,
        isLoading,
        isSuccess,
        isError: error !== null,
        isClosed,
        isNameTaken,
        isNameAmbiguous,
        resolvedAs,
        error,
        reset: () => {
            setIsSuccess(false);
            setError(null);
            setIsClosed(false)
            setIsNameTaken(false);
            setIsNameAmbiguous(false)
            setPending(null)
            setResolvedAs(null)
        }
    }
}
