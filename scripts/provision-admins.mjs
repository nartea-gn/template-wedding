import {createClient} from '@supabase/supabase-js'

const modeFlags = process.argv.slice(2).filter(argument => argument === '--local' || argument === '--production')

if (modeFlags.length !== 1) {
    throw new Error('Select exactly one destination with --local or --production.')
}

const mode = modeFlags[0].slice(2)
const supabaseUrl = requireEnvironment('SUPABASE_URL')
const secretKey = requireEnvironment('SUPABASE_SECRET_KEY')
const invitationId = requireEnvironment('NARTEA_INVITATION_ID')
const authMethod = requireEnvironment('NARTEA_ADMIN_AUTH_METHOD')
const emails = parseEmails(requireEnvironment('NARTEA_ADMIN_EMAILS'))

if (authMethod !== 'otp' && authMethod !== 'password') {
    throw new Error('NARTEA_ADMIN_AUTH_METHOD must be otp or password.')
}

assertDestination(mode, supabaseUrl, invitationId)

const supabase = createClient(supabaseUrl, secretKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
    },
})

const usersByEmail = await listUsersByEmail()

if (authMethod === 'password' && emails.some(email => !usersByEmail.has(email))) {
    throw new Error(
        'One or more password administrators do not exist in Supabase Auth. Create all missing password users '
        + 'privately before running this command again.',
    )
}

let createdUsers = 0
let existingUsers = 0
let memberships = 0

for (const email of emails) {
    let user = usersByEmail.get(email)

    if (!user) {
        const {data, error} = await supabase.auth.admin.createUser({email, email_confirm: true})
        if (error) throw error
        user = data.user
        usersByEmail.set(email, user)
        createdUsers += 1
    } else {
        existingUsers += 1
    }

    const {error: membershipError} = await supabase
        .from('invitation_admins')
        .upsert(
            {invitation_id: invitationId, user_id: user.id},
            {onConflict: 'invitation_id,user_id', ignoreDuplicates: true},
        )

    if (membershipError) throw membershipError
    memberships += 1
}

console.log(`Admin provisioning completed for ${invitationId}.`)
console.log(`Users created: ${createdUsers}. Users already present: ${existingUsers}.`)
console.log(`Memberships verified: ${memberships}. No users or memberships were removed.`)

function requireEnvironment(name) {
    const value = process.env[name]?.trim()
    if (!value) throw new Error(`Missing required environment variable: ${name}.`)
    return value
}

function parseEmails(value) {
    const normalized = [...new Set(value.split(',').map(email => email.trim().toLowerCase()).filter(Boolean))]
    if (normalized.length === 0) throw new Error('NARTEA_ADMIN_EMAILS must include at least one email.')

    for (const email of normalized) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error('NARTEA_ADMIN_EMAILS contains an invalid email address.')
        }
    }

    return normalized
}

function assertDestination(mode, value, expectedInvitationId) {
    const url = new URL(value)
    const isLoopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1'

    if (mode === 'local' && !isLoopback) {
        throw new Error('--local refuses to use a non-local SUPABASE_URL.')
    }

    if (mode === 'production' && process.env.NARTEA_PROVISION_CONFIRM !== expectedInvitationId) {
        throw new Error('Set NARTEA_PROVISION_CONFIRM to the invitation id before provisioning production.')
    }
}

async function listUsersByEmail() {
    const users = new Map()
    let page = 1

    while (true) {
        const {data, error} = await supabase.auth.admin.listUsers({page, perPage: 1000})
        if (error) throw error

        for (const user of data.users) {
            if (user.email) users.set(user.email.toLowerCase(), user)
        }

        if (data.users.length < 1000) return users
        page += 1
    }
}
