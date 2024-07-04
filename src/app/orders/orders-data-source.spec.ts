import type { Order, OrderGroup } from './orders.model';
import { getOrderProfit, recalculateOrderGroup } from './orders-data-source';

import {
  type OrderDTO,
  OrderDTOSide,
  OrderDTOSymbol,
} from '../orders/api/api.model';

export const orderDTO: (body?: Partial<OrderDTO>) => OrderDTO = (body) => ({
  id: 0,
  symbol: OrderDTOSymbol.BTCUSD,
  side: OrderDTOSide.BUY,
  size: 1,
  openTime: 0,
  swap: 1,
  openPrice: 10000,
  closePrice: 11000,
  ...body,
});

describe('getOrderProfit', () => {
  // formula: ((closePrice|currentPrice - openPrice) * multiplier * sideMultiplier) / 100
  const currentPrice = 12000;

  it('should return the correct value if symbol is BTCUSD and side is BUY', () => {
    // multiplier = 10^2 <- for BTCUSD, sideMultiplier = 1 <- for BUY
    const expectedProfit = ((currentPrice - 10000) * 100 * 1) / 100;

    expect(getOrderProfit(orderDTO(), currentPrice)).toBe(expectedProfit);
  });

  it('should return the correct value if side is SELL', () => {
    // sideMultiplier = -1 <- for SELL
    const expectedProfit = ((currentPrice - 10000) * 100 * -1) / 100;

    expect(
      getOrderProfit(orderDTO({ side: OrderDTOSide.SELL }), currentPrice),
    ).toBe(expectedProfit);
  });

  it('should return the correct value if symbol is ETHUSD', () => {
    // multiplier = 10^3 <- for ETHUSD
    const expectedProfit = ((currentPrice - 10000) * 1000 * 1) / 100;

    expect(
      getOrderProfit(orderDTO({ symbol: OrderDTOSymbol.ETHUSD }), currentPrice),
    ).toBe(expectedProfit);
  });

  it('should return the correct value if symbol is TTWO.US', () => {
    // multiplier = 10^1 <- for ETHUSD
    const expectedProfit = ((currentPrice - 10000) * 10 * 1) / 100;

    expect(
      getOrderProfit(
        orderDTO({ symbol: OrderDTOSymbol['TTWO.US'] }),
        currentPrice,
      ),
    ).toBe(expectedProfit);
  });

  it('should return the correct value if currentPrice argument is not set', () => {
    const expectedProfit = ((11000 - 10000) * 100 * 1) / 100;

    expect(getOrderProfit(orderDTO())).toBe(expectedProfit);
  });
});

describe('recalculateOrderGroup', () => {
  it('should update the group after adding and removing an order', () => {
    const initialOrder: Order = { ...orderDTO(), profit: 100 };
    const secondOrder: Order = {
      ...orderDTO({ size: 2, swap: 2 }),
      profit: 200,
    };

    const orderGroup: OrderGroup = {
      symbol: initialOrder.symbol,
      size: initialOrder.size,
      profit: initialOrder.profit,
      openPrice: initialOrder.openPrice,
      swap: initialOrder.swap,
      orders: [initialOrder],
    };

    recalculateOrderGroup(orderGroup, secondOrder);

    expect(orderGroup.size).toBe(initialOrder.size + secondOrder.size);
    expect(orderGroup.swap).toBe(initialOrder.swap + secondOrder.swap);

    // weighted average
    expect(orderGroup.openPrice).toBe(
      (initialOrder.openPrice * initialOrder.size +
        secondOrder.openPrice * secondOrder.size) /
        (initialOrder.size + secondOrder.size),
    );

    // weighted average
    expect(orderGroup.profit).toBe(
      (initialOrder.profit * initialOrder.size +
        secondOrder.profit * secondOrder.size) /
        (initialOrder.size + secondOrder.size),
    );

    recalculateOrderGroup(orderGroup, secondOrder, true);

    expect(orderGroup.size).toBe(initialOrder.size);
    expect(orderGroup.swap).toBe(initialOrder.swap);
    expect(orderGroup.openPrice).toBe(initialOrder.openPrice);
    expect(orderGroup.profit).toBe(initialOrder.profit);
  });
});
