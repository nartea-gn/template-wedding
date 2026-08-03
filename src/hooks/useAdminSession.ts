import {useCallback, useEffect, useState} from 'react'
import type {AuthError, Session} from '@supabase/supabase-js'
import {supabase} from '../lib/supabaseClient'

export type AdminAuthPhase = 'loading' | 'email' | 'code' | 'authenticated'
export type AdminAuthError = 'request' | 'verification' | 'verificationRequest' | 'session' | null

function isUnprovisionedIdentity(error: AuthError) {
    return error.status === 422 && error.code === 'otp_disabled'
}

export function useAdminSession() {
    const [session, setSession] = useState<Session | null>(null)
    const [phase, setPhase] = useState<AdminAuthPhase>('loading')
    const [email, setEmail] = useState('')
    const [error, setError] = useState<AdminAuthError>(null)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        let active = true

        void supabase.auth.getSession()
            .then(({data, error: sessionError}) => {
                if (!active) return
                setSession(data.session)
                setError(sessionError ? 'session' : null)
                setPhase(data.session ? 'authenticated' : 'email')
            })
            .catch(sessionError => {
                if (!active) return
                console.error('Unable to restore the admin session.', sessionError)
                setSession(null)
                setError('session')
                setPhase('email')
            })

        const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, nextSession) => {
            if (!active) return
            setSession(nextSession)
            setPhase(currentPhase => {
                if (nextSession) return 'authenticated'
                if (currentPhase === 'loading' || currentPhase === 'authenticated') return 'email'
                return currentPhase
            })
        })

        return () => {
            active = false
            subscription.unsubscribe()
        }
    }, [])

    const requestCode = useCallback(async (requestedEmail: string) => {
        const normalizedEmail = requestedEmail.trim().toLowerCase()
        setSubmitting(true)
        setError(null)

        try {
            const {error: requestError} = await supabase.auth.signInWithOtp({
                email: normalizedEmail,
                options: {shouldCreateUser: false},
            })

            if (requestError) {
                if (isUnprovisionedIdentity(requestError)) {
                    setEmail(normalizedEmail)
                    setPhase('code')
                    return true
                }

                console.error('Unable to request admin OTP.', requestError)
                setError('request')
                return false
            }

            setEmail(normalizedEmail)
            setPhase('code')
            return true
        } catch (requestError) {
            console.error('Unable to request admin OTP.', requestError)
            setError('request')
            return false
        } finally {
            setSubmitting(false)
        }
    }, [])

    const verifyCode = useCallback(async (token: string) => {
        setSubmitting(true)
        setError(null)

        try {
            const {error: verificationError} = await supabase.auth.verifyOtp({
                email,
                token,
                type: 'email',
            })

            if (verificationError) {
                setError('verification')
                return false
            }

            return true
        } catch (verificationError) {
            console.error('Unable to verify the admin OTP.', verificationError)
            setError('verificationRequest')
            return false
        } finally {
            setSubmitting(false)
        }
    }, [email])

    const changeEmail = useCallback(() => {
        setError(null)
        setPhase('email')
    }, [])

    const signOut = useCallback(async () => {
        setSubmitting(true)
        setError(null)

        try {
            const {error: signOutError} = await supabase.auth.signOut()
            if (signOutError) setError('session')
        } catch (signOutError) {
            console.error('Unable to close the admin session.', signOutError)
            setError('session')
        } finally {
            setSubmitting(false)
        }
    }, [])

    return {
        session,
        phase,
        email,
        error,
        submitting,
        requestCode,
        verifyCode,
        changeEmail,
        signOut,
    }
}
