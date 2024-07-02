import { Order } from './api/api.model';

export interface OrderWithProfit extends Order {
  profit: number | null;
}

export interface OrderGroup
  extends Pick<
    OrderWithProfit,
    'symbol' | 'size' | 'openPrice' | 'swap' | 'profit'
  > {
  items: OrderWithProfit[];
}

export interface Column {
  columnDef: string;
  header: string;
  cell: (element: OrderGroup | OrderWithProfit) => string;
  badge?: (element: OrderGroup | OrderWithProfit) => string;
}
