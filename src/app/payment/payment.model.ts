
export interface IMerchantPayment {
  id?: string;
  merchantId?: string;
  merchantName?: string;
  accountId?: string;
  accountName?: string;
  driverId?: string;
  driverName?: string;
  type?: string; // debit credit
  amount?: number;
  note?: string;
  delivered?: Date;
  status?: string;
  created?: Date;
  modified?: Date; // merchant confirm received date
}

export interface IMerchantBalance {
  id?: string;
  merchantId: string;
  merchantName: string;
  amount: number;
  created?: Date;
  modified?: Date;
}

export interface IClientPayment {
  id?: string;
  orderId?: string; // since 2019-05-29
  clientId?: string;
  clientName?: string;
  driverId?: string;
  driverName?: string;
  type?: string;
  amount?: number;
  delivered?: Date;
  created?: Date;
  modified?: Date;
}

export interface IClientBalance {
  id?: string;
  clientId: string;
  clientName: string;
  amount: number;
  created?: Date;
  modified?: Date;
}


export interface IMerchantPayment {
  id?: string;
  merchantId?: string;
  merchantName?: string;
  accountId?: string;
  accountName?: string;
  driverId?: string;
  driverName?: string;
  type?: string; // debit credit
  amount?: number;
  note?: string;
  delivered?: Date;
  status?: string;
  created?: Date;
  modified?: Date; // merchant confirm received date
}

export interface IMerchantBalance {
  id?: string;
  merchantId: string;
  merchantName: string;
  amount: number;
  created?: Date;
  modified?: Date;
}

export interface IMerchantPaymentData {
  date: string;
  receivable: number;
  paid: number;
  balance: number;
  type: string; // credit, debit
  merchantId?: string;
  merchantName?: string;
  driverId?: string;
  driverName?: string;
}

export interface IDriverPayment {
  fromId?: string;
  fromName?: string;
  toId?: string;
  toName?: string;
  type: string; // credit, debit
  amount: number;
  note?: string;
  created?: Date;
  modified?: Date;
}

export interface IDriverPaymentData {
  date: Date;
  received: number;
  paid: number;
  balance: number;
  driverId?: string;
  driverName?: string;
  type: string; // credit is from, debit is to
  targetId?: string; // credit is from, debit is to
  targetName?: string;
}

export interface ISalaryData {
  date: Date;
  driverId?: string;
  driverName?: string;
  hours: number;
  balance: number;
  nOrders?: number;
}

export interface IClientPaymentData {
  date: Date;
  consumed: number;
  paid: number;
  balance: number;
  type: string; // credit, debit
  description: string;
}
