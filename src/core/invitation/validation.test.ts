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
})
