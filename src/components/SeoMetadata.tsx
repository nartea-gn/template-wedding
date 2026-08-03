import {useEffect} from 'react'
import type {InvitationDefinition} from '../core/invitation'
import {useLocalization} from '../app/providers/useLocalization'

type Props<Message extends string> = {
    definition: InvitationDefinition<string, Message>['seo']
}

export function SeoMetadata<Message extends string>({definition}: Readonly<Props<Message>>) {
    const {t} = useLocalization<Message>()
    const title = t(definition.title)
    const description = t(definition.description)

    useEffect(() => {
        document.title = title
        let descriptionElement = document.querySelector<HTMLMetaElement>('meta[name="description"]')
        if (!descriptionElement) {
            descriptionElement = document.createElement('meta')
            descriptionElement.name = 'description'
            document.head.append(descriptionElement)
        }
        descriptionElement.content = description
    }, [description, title])

    return null
}
