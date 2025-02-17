import {
  BehaviorSubject,
  type Observable,
  Subscription,
  map,
  take,
  withLatestFrom,
} from 'rxjs';
import { DataSource } from '@angular/cdk/collections';
import { type MatTable } from '@angular/material/table';
import { inject } from '@angular/core';

import type { Order, OrderGroup } from './orders.model';
import { type OrderDTO, OrderDTOSide, OrderDTOSymbol } from './api/api.model';
import { ApiService } from './api/api.service';
import { NotificationService } from '../core/notification.service';

export function getOrderProfit(
  { symbol, side, openPrice, closePrice }: OrderDTO,
  currentPrice?: number,
): number {
  const exponent = ((): 1 | 2 | 3 => {
    switch (symbol) {
      case OrderDTOSymbol.BTCUSD:
        return 2;
      case OrderDTOSymbol.ETHUSD:
        return 3;
      case OrderDTOSymbol['TTWO.US']:
        return 1;
      default:
        throw new Error(`Unknown symbol: ${symbol}`);
    }
  })();

  const multiplier = Math.pow(10, exponent);
  const sideMultiplier = side === OrderDTOSide.BUY ? 1 : -1;
  const latestPrice = currentPrice ?? closePrice;

  return ((latestPrice - openPrice) * multiplier * sideMultiplier) / 100;
}

export function recalculateOrderGroup(
  group: OrderGroup,
  order: Order,
  onRemoveOrder = false,
): void {
  let size = order.size;
  let swap = order.swap;

  if (onRemoveOrder) {
    const index = group.orders.findIndex(({ id }) => id === order.id);

    group.orders.splice(index, 1);

    size = -size;
    swap = -swap;
  } else {
    group.orders.push(order);
  }

  group.profit =
    (group.profit * group.size + order.profit * size) / (group.size + size);

  group.openPrice =
    (group.openPrice * group.size + order.openPrice * size) /
    (group.size + size);

  group.size += size;
  group.swap += swap;
}

export class OrdersDataSource extends DataSource<OrderGroup> {
  private readonly _apiService = inject(ApiService);
  private readonly _notificationService = inject(NotificationService);
  private readonly _subscription = new Subscription();
  private readonly _data = new BehaviorSubject<
    Partial<Record<OrderDTOSymbol, OrderGroup>>
  >({});

  get data(): Partial<Record<OrderDTOSymbol, OrderGroup>> {
    return this._data.getValue();
  }

  constructor() {
    super();
    this._setData();
  }

  connect(): Observable<OrderGroup[]> {
    return this._data.asObservable().pipe(map((data) => Object.values(data)));
  }

  disconnect(): void {
    this._subscription.unsubscribe();
  }

  closeOrderGroup(event: MouseEvent, group: OrderGroup): void {
    event.stopPropagation();

    delete this.data[group.symbol];

    this._data.next(this.data);

    if (group.orders.length >= 1) {
      this._notificationService.showNotification(
        `Zamknięto zlecenie nr ${group.orders.map(({ id }) => id).join(', ')}.`,
      );
    }

    const remainingSymbols = Object.keys(this.data) as OrderDTOSymbol[];

    if (remainingSymbols.length <= 0) {
      this.disconnect();
      return;
    }

    this._apiService.removeSymbolsFromWatchList([group.symbol]);
  }

  closeOrder(event: MouseEvent, order: Order, tableRef: MatTable<Order>): void {
    event.stopPropagation();

    const group = this.data[order.symbol];

    if (!group) return;

    recalculateOrderGroup(group, order, true);

    this._notificationService.showNotification(
      `Zamknięto zlecenie nr ${order.id}.`,
    );

    if (group.orders.length <= 0) {
      this.closeOrderGroup(event, group);
      return;
    }

    this._data.next(this.data);
    tableRef.renderRows();
  }

  private _setData(): void {
    this._apiService
      .getOrders()
      .pipe(take(1))
      .subscribe({
        next: (orders) => {
          const data = orders.reduce(
            (acc, orderDTO) => {
              if (!acc[orderDTO.symbol]) {
                acc[orderDTO.symbol] = {
                  symbol: orderDTO.symbol,
                  size: 0,
                  openPrice: 0,
                  swap: 0,
                  profit: 0,
                  orders: [],
                };
              }

              const group = acc[orderDTO.symbol];
              const order: Order = {
                ...orderDTO,
                profit: getOrderProfit(orderDTO),
              };

              recalculateOrderGroup(group, order);

              return acc;
            },
            {} as Record<OrderDTOSymbol, OrderGroup>,
          );

          this._data.next(data);

          this._apiService.addSymbolsToWatchList(
            Object.keys(data) as OrderDTOSymbol[],
          );

          this._startUpdatingProfitValues();
        },
        error: () => {
          this._notificationService.showErrorNotification(
            'Nie udało się pobrać danych, spróbuj ponownie później.',
          );
        },
      });
  }

  private _startUpdatingProfitValues(): void {
    this._subscription.add(
      this._apiService
        .watchCurrentPrices()
        .pipe(withLatestFrom(this._data.asObservable()))
        .subscribe({
          next: ([currentPrices, data]) => {
            if (currentPrices.p !== '/quotes/subscribed') return;

            currentPrices.d.forEach(({ s: symbol, b: currentPrice }) => {
              const group = data[symbol];

              if (!group) return;

              let groupProfitNominator = 0;

              group.orders.forEach((order) => {
                order.profit = getOrderProfit(order, currentPrice);
                groupProfitNominator += order.size * order.profit;
              });

              group.profit = groupProfitNominator / group.size;
            });

            this._data.next(data);
          },
          error: () => {
            this._notificationService.showErrorNotification(
              'Nie udało się pobrać aktualnych danych. Wyświetlane wartości mogą być nieaktualne.',
            );
          },
        }),
    );
  }
}
