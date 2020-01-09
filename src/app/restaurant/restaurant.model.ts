import { Product } from '../product/product.model';
import { Picture } from '../picture.model';
import { Address } from '../account/account.model';
import { GeoPoint } from '../location/location.model';
import { Order } from '../order/order.model';

export enum MerchantType {
  RESTAURANT = 1,
  TELECOM
}

export interface IMerchant {
  _id?: string;
  name: string;
  description?: string;
  location?: GeoPoint;
  ownerId?: string;
  malls?: string[]; // mall id
  inRange?: boolean;
  type: MerchantType;
  created?: string;
  modified?: string;

  closed?: Date[];
  dow?: string[]; // day of week opening
  isClosed?: boolean;
  distance?: number; // km
  deliveryFee?: number;
  fullDeliveryFee?: number;
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
  type: MerchantType;
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
