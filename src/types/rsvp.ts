export type BusOption = 'ida_vuelta' | 'solo_ida' | 'solo_vuelta' | 'no'

export type RsvpFormData = {
    fullName: string
    attending: boolean | null
    dietaryOptions: string[]
    dietaryOther: string
    busOption: string
    songRequest: string
    message: string
}

export type RsvpInsert = Omit<RsvpFormData, 'attending'> & {
    attending: boolean
}

export type RsvpResponse = RsvpInsert & {
    id: number
    wedding_slug: string
    created_at: string
}
