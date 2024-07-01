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
