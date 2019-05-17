
export interface IClientPayment {
  id?: string;
  clientId?: string;
  clientName?: string;
  driverId?: string;
  driverName?: string;
  credit?: number;
  debit?: number;
  balance?: number;
  created?: Date;
  modified?: Date;
}
