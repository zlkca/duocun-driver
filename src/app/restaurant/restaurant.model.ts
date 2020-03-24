import { Product } from '../product/product.model';
import { Picture } from '../picture.model';
import { Address } from '../account/account.model';
import { GeoPoint } from '../location/location.model';
import { Order } from '../order/order.model';

export const MerchantType = {
  RESTAURANT: 'R',
  GROCERY: 'G',
  FRESH: 'F',
  TELECOM: 'T'
};
export const MerchantStatus = {
  ACTIVE: 'A',
  INACTIVE: 'I'
};
export interface IMerchant {
  _id?: string;
  name: string;
  description?: string;
  location?: GeoPoint;
  ownerId?: string;
  malls?: string[]; // mall id
  inRange?: boolean;
  type: string;
  created?: string;
  modified?: string;

  closed?: Date[];
  dow?: string[]; // day of week opening
  isClosed?: boolean;
  distance?: number; // km
  deliveryFee?: number;
  deliveryDiscount?: number;
  products?: Product[];
  orders?: Order[];
  pictures?: Picture[];
  address?: Address;
  order?: number;
}

// For database
export class Restaurant implements IMerchant {
  _id: string;
  name: string;
  description: string;
  location: GeoPoint;
  ownerId: string;
  malls: string[]; // mall id
  type: string;
  created: string;
  modified: string;
  closed?: Date[];
  dow?: string[]; // day of week opening
  products: Product[];
  pictures: Picture[];
  address: Address;
  order?: number;
  constructor(data?: IMerchant) {
    Object.assign(this, data);
  }
}
