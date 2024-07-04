export interface OrderDTO {
  id: number;
  symbol: OrderDTOSymbol;
  side: OrderDTOSide;
  size: number;
  openTime: number;
  openPrice: number;
  swap: number;
  closePrice: number;
}

export enum OrderDTOSymbol {
  BTCUSD = 'BTCUSD',
  ETHUSD = 'ETHUSD',
  'TTWO.US' = 'TTWO.US',
}

export enum OrderDTOSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export type CurrentPricesDTO =
  | {
      p: '/quotes/subscribed';
      d: {
        s: OrderDTOSymbol;
        b: number;
        a: number;
        t: number;
      }[];
    }
  | {
      p: '/subscribe/addlist';
      i: number;
    };

export interface CurrentPricesDTOMessage {
  p: '/subscribe/addlist' | '/subscribe/removelist';
  d: OrderDTOSymbol[];
}
