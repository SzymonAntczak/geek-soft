import type { OrderDTO } from './api/api.model';

export interface Order extends OrderDTO {
  profit: number;
}

export interface OrderGroup
  extends Pick<Order, 'symbol' | 'size' | 'openPrice' | 'swap' | 'profit'> {
  orders: Order[];
}

export interface Column {
  columnDef: string;
  header: string;
  cell: (element: OrderGroup | Order) => string;
  badge?: (element: OrderGroup | Order) => string;
  class?: (element: OrderGroup | Order) => string;
}
