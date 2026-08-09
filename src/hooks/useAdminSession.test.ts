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
})
