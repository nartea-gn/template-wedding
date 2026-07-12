import {InvitationRenderer} from '../app/invitation'
import {weddingInvitation, weddingSectionRegistry} from '../invitations/wedding'
import './Landing.css'

export default function Landing() {
    return (
        <main className="landing-page">
            <InvitationRenderer definition={weddingInvitation} registry={weddingSectionRegistry}/>
        </main>
    )
}
