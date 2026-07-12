import type {ComponentType} from 'react'
import type {InvitationDefinition, InvitationSection} from '../../core/invitation'

export type SectionComponentProps<Message extends string, Type extends InvitationSection<Message>['type']> = {
    section: Extract<InvitationSection<Message>, {type: Type}>
    event: InvitationDefinition<string, Message>['event']
}

export type SectionRegistry<Message extends string> = {
    [Type in InvitationSection<Message>['type']]: ComponentType<SectionComponentProps<Message, Type>>
}
