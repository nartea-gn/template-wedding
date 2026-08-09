import {describe, expect, it} from 'vitest'
import {weddingInvitation} from '../../invitations/wedding'
import {validateInvitationDefinition} from './validation'

describe('validateInvitationDefinition', () => {
    it('accepts the canonical wedding invitation', () => {
        expect(validateInvitationDefinition(weddingInvitation)).toEqual([])
    })

    it('rejects an administrative capability without RSVP', () => {
        const definition = {
            ...weddingInvitation,
            capabilities: {
                ...weddingInvitation.capabilities,
                rsvp: {...weddingInvitation.capabilities.rsvp, enabled: false},
                admin: {...weddingInvitation.capabilities.admin, enabled: true},
            },
        }

        expect(validateInvitationDefinition(definition)).toContain('Admin requires the RSVP capability to be enabled')
    })

    it.each(['otp', 'password'] as const)('accepts the %s administrative authentication method', method => {
        const definition = {
            ...weddingInvitation,
            capabilities: {
                ...weddingInvitation.capabilities,
                admin: {...weddingInvitation.capabilities.admin, auth: {method}},
            },
        }

        expect(validateInvitationDefinition(definition)).toEqual([])
    })

    it.each([
        ['missing', undefined],
        ['unsupported', {method: 'magic-link'}],
    ])('rejects an administrative authentication method that is %s', (_case, auth) => {
        const definition = {
            ...weddingInvitation,
            capabilities: {
                ...weddingInvitation.capabilities,
                admin: {...weddingInvitation.capabilities.admin, auth},
            },
        }

        expect(validateInvitationDefinition(definition as unknown as typeof weddingInvitation)).toContain(
            'Admin requires a supported authentication method',
        )
    })

    it('rejects duplicate section identifiers', () => {
        const firstSection = weddingInvitation.sections[0]
        const definition = {...weddingInvitation, sections: [firstSection, firstSection]}

        expect(validateInvitationDefinition(definition)).toContain('Section ids must be unique')
    })

    it('rejects pagination options that omit the active page size', () => {
        const definition = {
            ...weddingInvitation,
            capabilities: {
                ...weddingInvitation.capabilities,
                admin: {
                    ...weddingInvitation.capabilities.admin,
                    controls: {
                        ...weddingInvitation.capabilities.admin.controls,
                        pagination: {
                            enabled: true,
                            pageSize: 10,
                            pageSizeSelector: {enabled: true, options: [20, 40]},
                        },
                    },
                },
            },
        }

        expect(validateInvitationDefinition(definition)).toContain(
            'Admin pagination pageSize must be included in pageSizeSelector options',
        )
    })

    it('rejects ambiguous event dates and invalid timezones', () => {
        const definition = {
            ...weddingInvitation,
            event: {...weddingInvitation.event, date: '2027-06-12', timezone: 'Madrid'},
        }

        expect(validateInvitationDefinition(definition)).toEqual(expect.arrayContaining([
            'Event date must be an ISO 8601 instant with an explicit offset',
            'Event timezone must be a valid IANA timezone',
        ]))
    })

    it('requires the RSVP deadline to precede the event', () => {
        const definition = {
            ...weddingInvitation,
            capabilities: {
                ...weddingInvitation.capabilities,
                rsvp: {...weddingInvitation.capabilities.rsvp, deadline: '2027-06-13T00:00:00+02:00'},
            },
        }

        expect(validateInvitationDefinition(definition)).toContain('RSVP deadline must be before the event date')
    })

    it('rejects empty structural content in enabled sections', () => {
        const cta = weddingInvitation.sections.find(section => section.type === 'rsvp-cta')
        if (!cta || cta.type !== 'rsvp-cta') throw new Error('Canonical RSVP CTA not found')
        const definition = {
            ...weddingInvitation,
            sections: [{...cta, content: {...cta.content, closedLabel: ''}}],
        }

        expect(validateInvitationDefinition(definition)).toContain(
            'RSVP CTA section rsvp-cta requires open and closed labels',
        )
    })
})
