import { Product, IProduct } from '../product/product.model';
// import { Picture } from '../picture.model';
import { Address } from '../entity.model';
import { ILocation } from '../location/location.model';
import { IAccount } from '../account/account.model';
import { IMerchant } from '../restaurant/restaurant.model';

export const OrderType = {
  FOOD_DELIVERY: 'F',
  MOBILE_PLAN_SETUP: 'MS',
  MOBILE_PLAN_MONTHLY: 'MM',
  GROCERY: 'G'
};

export const OrderStatus = {
  BAD:     'B',          // client return, compansate
  DELETED: 'D',          // cancellation
  TEMP:    'T',             // generate a temp order for electronic order
  NEW:     'N',
  LOADED:  'L',           // The driver took the food from Merchant
  DONE:    'F',             // Finish delivery
  MERCHANT_CHECKED: 'MC'  // VIEWED BY MERCHANT
};



export interface IOrder {
  _id?: string;
  id?: string;
  code?: string;
  clientId?: string;
  clientName?: string;
  clientPhoneNumber?: string;
  prepaidClient?: boolean;
  clientBalance?: number;
  merchantId?: string;
  merchantName?: string;
  driverId?: string;
  driverName?: string;

  type?: string;             // in db
  status: string;          // in db
  paymentStatus: string; // in db

  pickupTime?: string;
  deliverDate?: string;
  deliverTime?: string;

  paid?: boolean;
  note?: string;
  address?: string;
  location?: ILocation;
  delivered?: Date;
  created?: Date;
  modified?: Date;
  items?: IOrderItem[];
  deliveryAddress?: Address;
  deliveryCost?: number;
  deliveryFee?: number;
  deliveryDiscount?: number;
  total?: number;
  received?: number; // 2019-05-29
  balance?: number;
  receivable?: number;

  merchant?: IMerchant;
  client?: IAccount;
  driver?: IAccount;
  nOrders?: number;
  owe?: number;
}

export class Order implements IOrder {
  id: string;
  clientId: string;
  clientName: string;
  clientPhoneNumber?: string;
  prepaidClient?: boolean;
  clientBalance?: number;
  merchantId: string;
  merchantName: string;
  driverId: string;
  driverName?: string;

  type?: string;             // in db
  status: string;          // in db
  paymentStatus: string; // in db

  note: string;
  address: string;
  location?: ILocation;
  delivered: Date;
  created: Date;
  modified: Date;
  items: OrderItem[];
  deliveryAddress: Address;
  deliveryCost?: number;
  deliveryFee: number;
  deliveryDiscount: number;
  total: number;
  balance?: number;
  constructor(data?: IOrder) {
    Object.assign(this, data);
  }
}

export interface IOrderItem {
  id?: number;
  productId: string;
  productName: string;
  merchantId: string;
  merchantName: string;
  price: number;
  cost?: number;
  quantity: number;
  product?: IProduct;
}

export class OrderItem implements IOrderItem {
  id: number;
  productId: string;
  productName: string;
  merchantId: string;
  merchantName: string;
  price: number;
  cost?: number;
  quantity: number;
  constructor(data?: IOrderItem) {
    Object.assign(this, data);
  }
}
