export interface TOffice {
    id: number,
    name: string,
    latitude: number,
    longitude: number,
    photoUrl: string,
    city: string,
    address: string,
    createdByUserId?: number | string | null,
    floorsCount: number
}

