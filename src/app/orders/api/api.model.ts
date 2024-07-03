export interface Order {
  id: number;
  symbol: OrderSymbol;
  side: OrderSide;
  size: number;
  openTime: number;
  openPrice: number;
  swap: number;
  closePrice: number;
}

export enum OrderSymbol {
  BTCUSD = 'BTCUSD',
  ETHUSD = 'ETHUSD',
  'TTWO.US' = 'TTWO.US',
}

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export type CurrentPricesWS =
  | {
      p: '/quotes/subscribed';
      d: {
        s: OrderSymbol;
        b: number;
        a: number;
        t: number;
      }[];
    }
  | {
      p: '/subscribe/addlist';
      i: number;
    };

export interface CurrentPricesWSMessage {
  p: '/subscribe/addlist' | '/subscribe/removelist';
  d: OrderSymbol[];
}
