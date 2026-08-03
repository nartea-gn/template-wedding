import {useCallback, useEffect, useState} from 'react'
import type {Session} from '@supabase/supabase-js'
import {supabase} from '../lib/supabaseClient'

export type AdminAuthPhase = 'loading' | 'email' | 'code' | 'authenticated'
export type AdminAuthError = 'request' | 'verification' | 'session' | null

export function useAdminSession() {
    const [session, setSession] = useState<Session | null>(null)
    const [phase, setPhase] = useState<AdminAuthPhase>('loading')
    const [email, setEmail] = useState('')
    const [error, setError] = useState<AdminAuthError>(null)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        let active = true

        void supabase.auth.getSession().then(({data, error: sessionError}) => {
            if (!active) return
            setSession(data.session)
            setError(sessionError ? 'session' : null)
            setPhase(data.session ? 'authenticated' : 'email')
        })

        const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, nextSession) => {
            if (!active) return
            setSession(nextSession)
            setPhase(nextSession ? 'authenticated' : 'email')
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

        const {error: verificationError} = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email',
        })

        setSubmitting(false)
        if (verificationError) {
            setError('verification')
            return false
        }

        return true
    }, [email])

    const changeEmail = useCallback(() => {
        setError(null)
        setPhase('email')
    }, [])

    const signOut = useCallback(async () => {
        setSubmitting(true)
        setError(null)
        const {error: signOutError} = await supabase.auth.signOut()
        setSubmitting(false)
        if (signOutError) setError('session')
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
