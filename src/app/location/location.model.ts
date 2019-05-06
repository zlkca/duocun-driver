
export interface GeoPoint  {
  lat?: number;
  lng?: number;
  type?: string;
  coordinates?: number[];
}

export interface ILocation {
  placeId: string;
  city: string;
  lat: number;
  lng: number;
  postalCode: string;
  province: string;
  streetName: string;
  streetNumber: string;
  subLocality: string;
}

export interface ILatLng {
  lat: number;
  lng: number;
}

export interface IPlaceTerm {
  offset: number;
  value: string;
}

export interface IStructuredAddress {
  main_text: string;
  secondary_text: string;
}
export interface IPlace {
  id?: string;
  type?: string;
  description?: string;
  placeId?: string;
  structured_formatting: IStructuredAddress;
  terms?: IPlaceTerm[];
  location?: ILocation;
}

export interface ILocationHistory {
  id?: string;
  userId: string;
  placeId: string;
  location: ILocation;
  created: Date;
  type: string;
}
export class LocationHistory {
  id?: string;
  userId: string;
  placeId: string;
  location: Location;
  created: Date;
  type: string;
}

export interface IPair {
  value: number;
  text: string;
}

export interface IDistance {
  origin: ILocation;
  destination: ILocation;
  status: string;
  duration: IPair;
  distance: IPair;
}
