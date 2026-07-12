import type {FormDefinition} from '../../core/forms'
import type {WeddingMessageKey} from './locales/es'

export const weddingRsvpForm = {
    id: 'wedding-rsvp', version: 1,
    submission: {identityFieldId: 'fullName', attendanceFieldId: 'attending'},
    messages: {
        next: 'rsvp.next',
        back: 'rsvp.back',
        submit: 'rsvp.submit',
        submitting: 'rsvp.submitting',
        errors: {
            required: 'form.error.required',
            email: 'form.error.email',
            minLength: 'form.error.minLength',
            maxLength: 'form.error.maxLength'
        }
    },
    steps: [
        {
            id: 'attendance',
            title: 'rsvp.step.attendance.title',
            subtitle: 'rsvp.step.attendance.subtitle',
            elements: [
                {
                    id: 'fullName',
                    type: 'text',
                    label: 'rsvp.fullName.label',
                    placeholder: 'rsvp.fullName.placeholder',
                    required: true,
                    initialValue: ''
                },
                {
                    id: 'attending',
                    type: 'radio',
                    label: 'rsvp.attending.label',
                    required: true,
                    initialValue: null,
                    options: [{value: true, label: 'rsvp.attending.yes', icon: '💍'}, {
                        value: false,
                        label: 'rsvp.attending.no',
                        completesForm: true,
                        icon: '💔'
                    }]
                },
            ]
        },
        {
            id: 'meal',
            title: 'rsvp.step.meal.title',
            subtitle: 'rsvp.step.meal.subtitle',
            visibleWhen: {fieldId: 'attending', equals: true},
            elements: [
                {
                    id: 'dietaryOptions',
                    type: 'checkbox-group',
                    label: 'rsvp.dietary.label',
                    initialValue: [],
                    options: [{value: 'none', label: 'rsvp.dietary.none'}, {
                        value: 'gluten',
                        label: 'rsvp.dietary.gluten'
                    }, {value: 'vegetarian', label: 'rsvp.dietary.vegetarian'}, {
                        value: 'lactose',
                        label: 'rsvp.dietary.lactose'
                    }, {value: 'nuts_seafood', label: 'rsvp.dietary.nutsSeafood'}]
                },
                {
                    id: 'dietaryOther',
                    type: 'text',
                    label: 'rsvp.dietary.other',
                    placeholder: 'rsvp.dietary.other',
                    initialValue: ''
                },
                {
                    id: 'busOption',
                    type: 'select',
                    label: 'rsvp.bus.label',
                    placeholder: 'rsvp.bus.placeholder',
                    initialValue: '',
                    options: [{value: 'ida_vuelta', label: 'rsvp.bus.roundTrip'}, {
                        value: 'solo_ida',
                        label: 'rsvp.bus.outbound'
                    }, {value: 'solo_vuelta', label: 'rsvp.bus.return'}, {value: 'no', label: 'rsvp.bus.no'}]
                },
            ]
        },
        {
            id: 'music',
            title: 'rsvp.step.music.title',
            subtitle: 'rsvp.step.music.subtitle',
            visibleWhen: {fieldId: 'attending', equals: true},
            elements: [{id: 'giftInfo', type: 'info', label: 'rsvp.gift.info'}, {
                id: 'songRequest',
                type: 'text',
                label: 'rsvp.song.label',
                placeholder: 'rsvp.song.placeholder',
                initialValue: ''
            }]
        },
        {
            id: 'message',
            title: 'rsvp.step.message.title',
            subtitle: 'rsvp.step.message.subtitle',
            visibleWhen: {fieldId: 'attending', equals: true},
            elements: [{
                id: 'message',
                type: 'textarea',
                label: 'rsvp.message.label',
                placeholder: 'rsvp.message.placeholder',
                initialValue: ''
            }]
        },
    ],
} as const satisfies FormDefinition<WeddingMessageKey>
