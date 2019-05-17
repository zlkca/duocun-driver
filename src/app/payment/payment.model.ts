
export interface IMerchantPayment {
  id?: string;
  merchantId?: string;
  merchantName?: string;
  accountId?: string;
  accountName?: string;
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

export interface IClientBalance {
  id?: string;
  accountId: string;
  accountName: string;
  amount: number;
  created?: Date;
  modified?: Date;
}
