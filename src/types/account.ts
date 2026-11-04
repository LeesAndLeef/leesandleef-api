export interface Address {
  street: string
  postcode: string
  city: string
  country: string
  door?: string
}

export interface Account {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  address: Address | null
}
