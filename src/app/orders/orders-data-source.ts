import { DataSource } from '@angular/cdk/collections';
import { inject } from '@angular/core';
import { MatTable } from '@angular/material/table';
import { Subject, Subscription, take } from 'rxjs';
import { OrderGroup, OrderWithProfit } from './orders.model';
import { ApiService } from './api/api.service';
import { Order, OrderSide, OrderSymbol } from './api/api.model';

export class OrdersDataSource extends DataSource<OrderGroup> {
  private readonly _apiService = inject(ApiService);
  private readonly _dataSubject = new Subject<OrderGroup[]>();

  private _data?: Record<OrderSymbol, OrderGroup>;
  private _subscription?: Subscription;

  constructor() {
    super();
    this._setData();
  }

  connect() {
    return this._dataSubject.asObservable();
  }

  disconnect() {
    this._subscription?.unsubscribe();
  }

  closeOrderGroup(event: MouseEvent, group: OrderGroup): void {
    event.stopPropagation();

    if (!this._data) return;

    delete this._data[group.symbol];

    this._updateDataSubject(this._data);
    this._subscription?.unsubscribe();

    const remainingSymbols = Object.keys(this._data) as OrderSymbol[];

    if (remainingSymbols.length <= 0) return;

    this._startUpdatingProfitValues(remainingSymbols);
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
    this._calcOrderGroupValues(group, order, true);
    this._updateDataSubject(this._data);
    tableRef.renderRows();

    if (group.items.length > 0) return;

    this.closeOrderGroup(event, group);
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

        this._startUpdatingProfitValues(
          Object.keys(this._data) as OrderSymbol[],
        );
      });
  }

  private _startUpdatingProfitValues(symbols: OrderSymbol[]): void {
    this._subscription = this._apiService
      .watchCurrentPrices(symbols)
      .subscribe((data) => {
        if (data.p === '/subscribe/addlist' || !this._data) return;

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
      });
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
  ) {
    let size = order.size;
    let swap = order.swap;

    if (hasOrderBeenRemoved) {
      size = -size;
      swap = -swap;
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
}
