import {act, renderHook, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {useAdminSession} from './useAdminSession'

const auth = vi.hoisted(() => ({
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithOtp: vi.fn(),
    verifyOtp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
}))

vi.mock('../lib/supabaseClient', () => ({supabase: {auth}}))

describe('useAdminSession', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        auth.getSession.mockResolvedValue({data: {session: null}, error: null})
        auth.onAuthStateChange.mockReturnValue({
            data: {subscription: {unsubscribe: vi.fn()}},
        })
        auth.signInWithOtp.mockResolvedValue({error: null})
        auth.verifyOtp.mockResolvedValue({error: null})
        auth.signInWithPassword.mockResolvedValue({error: null})
        auth.signOut.mockResolvedValue({error: null})
    })

    it('restores the unauthenticated phase selected by configuration', async () => {
        const {result} = renderHook(() => useAdminSession('password'))

        await waitFor(() => expect(result.current.phase).toBe('password'))
        expect(result.current.session).toBeNull()
    })

    it('uses Supabase password authentication with a normalized email', async () => {
        const {result} = renderHook(() => useAdminSession('password'))
        await waitFor(() => expect(result.current.phase).toBe('password'))

        await act(async () => {
            expect(await result.current.authenticateWithPassword(' Admin@Example.com ', 'private-password')).toBe(true)
        })

        expect(auth.signInWithPassword).toHaveBeenCalledWith({
            email: 'admin@example.com',
            password: 'private-password',
        })
        expect(result.current.error).toBeNull()
    })

    it('returns a generic credentials error for a rejected password', async () => {
        auth.signInWithPassword.mockResolvedValue({error: new Error('Invalid login credentials')})
        const {result} = renderHook(() => useAdminSession('password'))
        await waitFor(() => expect(result.current.phase).toBe('password'))

        await act(async () => {
            expect(await result.current.authenticateWithPassword('admin@example.com', 'wrong')).toBe(false)
        })

        expect(result.current.error).toBe('credentials')
    })

    it('preserves the OTP request flow when configured', async () => {
        const {result} = renderHook(() => useAdminSession('otp'))
        await waitFor(() => expect(result.current.phase).toBe('email'))

        await act(async () => {
            expect(await result.current.requestCode(' Admin@Example.com ')).toBe(true)
        })

        expect(auth.signInWithOtp).toHaveBeenCalledWith({
            email: 'admin@example.com',
            options: {shouldCreateUser: false},
        })
        expect(result.current.phase).toBe('code')
    })

    it('does not reveal that an email is unprovisioned', async () => {
        // Answering "that address is not registered" would turn the login screen into a way to
        // enumerate the couple's addresses, so the flow advances exactly as if it had worked.
        auth.signInWithOtp.mockResolvedValue({error: {status: 422, code: 'otp_disabled', message: 'Signups not allowed'}})
        const {result} = renderHook(() => useAdminSession('otp'))
        await waitFor(() => expect(result.current.phase).toBe('email'))

        await act(async () => {
            expect(await result.current.requestCode('stranger@example.com')).toBe(true)
        })

        expect(result.current.phase).toBe('code')
        expect(result.current.error).toBeNull()
    })

    it('verifies the code against the address the guest already gave', async () => {
        const {result} = renderHook(() => useAdminSession('otp'))
        await waitFor(() => expect(result.current.phase).toBe('email'))
        await act(async () => {
            await result.current.requestCode('Admin@Example.com')
        })

        await act(async () => {
            expect(await result.current.verifyCode('123456')).toBe(true)
        })

        expect(auth.verifyOtp).toHaveBeenCalledWith({
            email: 'admin@example.com',
            token: '123456',
            type: 'email',
        })
    })

    it('reports a rejected code without leaving the code phase', async () => {
        auth.verifyOtp.mockResolvedValue({error: new Error('Token has expired')})
        const {result} = renderHook(() => useAdminSession('otp'))
        await waitFor(() => expect(result.current.phase).toBe('email'))
        await act(async () => {
            await result.current.requestCode('admin@example.com')
        })

        await act(async () => {
            expect(await result.current.verifyCode('000000')).toBe(false)
        })

        expect(result.current.error).toBe('verification')
        expect(result.current.phase).toBe('code')
    })

    it('returns to the email phase and clears the error when changing address', async () => {
        auth.verifyOtp.mockResolvedValue({error: new Error('Token has expired')})
        const {result} = renderHook(() => useAdminSession('otp'))
        await waitFor(() => expect(result.current.phase).toBe('email'))
        await act(async () => {
            await result.current.requestCode('admin@example.com')
        })
        await act(async () => {
            await result.current.verifyCode('000000')
        })

        act(() => result.current.changeEmail())

        expect(result.current.phase).toBe('email')
        expect(result.current.error).toBeNull()
    })

    it('surfaces a failed sign out instead of pretending it worked', async () => {
        auth.signOut.mockResolvedValue({error: new Error('network down')})
        const {result} = renderHook(() => useAdminSession('password'))
        await waitFor(() => expect(result.current.phase).toBe('password'))

        await act(async () => {
            await result.current.signOut()
        })

        expect(result.current.error).toBe('session')
        expect(result.current.submitting).toBe(false)
    })

    it.each([
        ['otp', 'email'],
        ['password', 'password'],
    ] as const)('reverts a %s session to its own unauthenticated phase when it ends', async (method, expectedPhase) => {
        let emitSession: ((event: string, session: unknown) => void) | undefined
        auth.onAuthStateChange.mockImplementation((callback: (event: string, session: unknown) => void) => {
            emitSession = callback
            return {data: {subscription: {unsubscribe: vi.fn()}}}
        })
        const {result} = renderHook(() => useAdminSession(method))
        await waitFor(() => expect(result.current.phase).toBe(expectedPhase))

        act(() => emitSession?.('SIGNED_IN', {user: {id: 'admin'}}))
        expect(result.current.phase).toBe('authenticated')

        act(() => emitSession?.('SIGNED_OUT', null))
        expect(result.current.phase).toBe(expectedPhase)
        expect(result.current.session).toBeNull()
    })
})
