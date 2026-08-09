import {useCallback, useEffect, useState} from 'react'
import type {AuthError, Session} from '@supabase/supabase-js'
import {supabase} from '../lib/supabaseClient'
import type {AdminAuthMethod} from '../core/invitation'

export type AdminAuthPhase = 'loading' | 'email' | 'code' | 'password' | 'authenticated'
export type AdminAuthError =
    | 'request'
    | 'verification'
    | 'verificationRequest'
    | 'credentials'
    | 'authenticationRequest'
    | 'session'
    | null

function isUnprovisionedIdentity(error: AuthError) {
    return error.status === 422 && error.code === 'otp_disabled'
}

function getUnauthenticatedPhase(method: AdminAuthMethod): Extract<AdminAuthPhase, 'email' | 'password'> {
    return method === 'password' ? 'password' : 'email'
}

export function useAdminSession(method: AdminAuthMethod) {
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
                setPhase(data.session ? 'authenticated' : getUnauthenticatedPhase(method))
            })
            .catch(sessionError => {
                if (!active) return
                console.error('Unable to restore the admin session.', sessionError)
                setSession(null)
                setError('session')
                setPhase(getUnauthenticatedPhase(method))
            })

        const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, nextSession) => {
            if (!active) return
            setSession(nextSession)
            setPhase(currentPhase => {
                if (nextSession) return 'authenticated'
                if (currentPhase === 'loading' || currentPhase === 'authenticated') {
                    return getUnauthenticatedPhase(method)
                }
                return currentPhase
            })
        })

        return () => {
            active = false
            subscription.unsubscribe()
        }
    }, [method])

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

    const authenticateWithPassword = useCallback(async (requestedEmail: string, password: string) => {
        const normalizedEmail = requestedEmail.trim().toLowerCase()
        setSubmitting(true)
        setError(null)

        try {
            const {error: authenticationError} = await supabase.auth.signInWithPassword({
                email: normalizedEmail,
                password,
            })

            if (authenticationError) {
                setError('credentials')
                return false
            }

            setEmail(normalizedEmail)
            return true
        } catch (authenticationError) {
            console.error('Unable to authenticate the admin session.', authenticationError)
            setError('authenticationRequest')
            return false
        } finally {
            setSubmitting(false)
        }
    }, [])

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
        authenticateWithPassword,
        changeEmail,
        signOut,
    }
}
