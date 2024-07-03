import { DataSource } from '@angular/cdk/collections';
import { inject } from '@angular/core';
import { type MatTable } from '@angular/material/table';
import { Subject, Subscription, take } from 'rxjs';
import type { OrderGroup, OrderWithProfit } from './orders.model';
import { ApiService } from './api/api.service';
import { type Order, OrderSide, OrderSymbol } from './api/api.model';
import { NotificationService } from '../core/notification.service';

export class OrdersDataSource extends DataSource<OrderGroup> {
  private readonly _apiService = inject(ApiService);
  private readonly _notificationService = inject(NotificationService);
  private readonly _dataSubject = new Subject<OrderGroup[]>();
  private readonly _subscription = new Subscription();

  private _data?: Record<OrderSymbol, OrderGroup>;

  constructor() {
    super();
    this._setData();
  }

  connect() {
    return this._dataSubject.asObservable();
  }

  disconnect() {
    this._subscription.unsubscribe();
  }

  closeOrderGroup(event: MouseEvent, group: OrderGroup): void {
    event.stopPropagation();

    if (!this._data) return;

    delete this._data[group.symbol];

    this._updateDataSubject(this._data);

    if (group.items.length >= 1) {
      this._showNotification(group.items);
    }

    const remainingSymbols = Object.keys(this._data) as OrderSymbol[];

    if (remainingSymbols.length <= 0) {
      this.disconnect();
      return;
    }

    this._apiService.removeSymbolsFromWatchList([group.symbol]);
  }

  closeOrder(
    event: MouseEvent,
    order: OrderWithProfit,
    tableRef: MatTable<OrderWithProfit>,
  ): void {
    event.stopPropagation();

    if (!this._data) return;

    const group = this._data[order.symbol];
    const index = group.items.findIndex(({ id }) => id === order.id);

    group.items.splice(index, 1);
    this._showNotification([order]);

    if (group.items.length <= 0) {
      this.closeOrderGroup(event, group);
      return;
    }

    this._calcOrderGroupValues(group, order, true);
    this._updateDataSubject(this._data);
    tableRef.renderRows();
  }

  private _setData(): void {
    this._apiService
      .getOrders()
      .pipe(take(1))
      .subscribe((orders) => {
        this._data = orders.reduce(
          (acc, order) => {
            if (!acc[order.symbol]) {
              acc[order.symbol] = {
                symbol: order.symbol,
                size: 0,
                openPrice: 0,
                swap: 0,
                profit: null,
                items: [],
              };
            }

            const group = acc[order.symbol];
            const item: OrderWithProfit = {
              ...order,
              profit: null,
            };

            this._calcOrderGroupValues(group, item);

            group.items.push(item);

            return acc;
          },
          {} as Record<OrderSymbol, OrderGroup>,
        );

        this._updateDataSubject(this._data);

        this._apiService.addSymbolsToWatchList(
          Object.keys(this._data) as OrderSymbol[],
        );

        this._startUpdatingProfitValues();
      });
  }

  private _startUpdatingProfitValues(): void {
    this._subscription.add(
      this._apiService.watchCurrentPrices().subscribe((data) => {
        if (data.p !== '/quotes/subscribed' || !this._data) return;

        data.d.forEach(({ s: symbol, b: currentPrice }) => {
          const group = this._data?.[symbol];

          if (!group) return;

          let groupProfitNominator = 0;

          group.items.forEach((item) => {
            item.profit = this._getOrderProfit(item, currentPrice);
            groupProfitNominator += item.size * item.profit;
          });

          group.profit = groupProfitNominator / group.size;
        });

        this._updateDataSubject(this._data);
      }),
    );
  }

  private _getOrderProfit(
    { symbol, side, openPrice }: Order,
    currentPrice: number,
  ): number {
    const exponent = (() => {
      switch (symbol) {
        case OrderSymbol.BTCUSD:
          return 2;
        case OrderSymbol.ETHUSD:
          return 3;
        case OrderSymbol['TTWO.US']:
          return 1;
        default:
          throw new Error(`Unknown symbol: ${symbol}`);
      }
    })();

    const multiplier = Math.pow(10, exponent);
    const sideMultiplier = side === OrderSide.BUY ? 1 : -1;

    return ((currentPrice - openPrice) * multiplier * sideMultiplier) / 100;
  }

  private _calcOrderGroupValues(
    group: OrderGroup,
    order: OrderWithProfit,
    hasOrderBeenRemoved = false,
  ): void {
    let size = order.size;
    let swap = order.swap;

    if (hasOrderBeenRemoved) {
      size = -size;
      swap = -swap;
    }

    if (group.profit && order.profit) {
      group.profit =
        (group.profit * group.size + order.profit * size) / (group.size + size);
    }

    group.openPrice =
      (group.openPrice * group.size + order.openPrice * size) /
      (group.size + size);

    group.size += size;
    group.swap += swap;
  }

  private _updateDataSubject(newData: Record<OrderSymbol, OrderGroup>) {
    this._dataSubject.next(Object.values(newData));
  }

  private _showNotification(items: OrderWithProfit[]) {
    this._notificationService.showNotification(
      `Zamknięto zlecenie nr ${items.map(({ id }) => id).join(', ')}`,
    );
  }
}
