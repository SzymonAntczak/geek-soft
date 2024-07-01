import { Component, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DataSource } from '@angular/cdk/collections';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Observable, map, tap } from 'rxjs';
import { ApiService } from './api/api.service';
import { type Order, OrderSide, OrderSymbol } from './api/api.model';
import type { Column, OrderWithProfit, OrderGroup } from './orders.model';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule],
  providers: [ApiService],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'),
      ),
    ]),
  ],
})
export class OrdersComponent {
  private readonly _dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'short',
    timeStyle: 'medium',
  });

  readonly dataSource = new OrdersDataSource();
  readonly columns: Column[] = [
    {
      columnDef: 'symbol',
      header: 'Symbol',
      cell: (element) => ('items' in element ? `${element.symbol}` : ''),
      badge: (element) => ('items' in element ? `${element.items.length}` : ''),
    },
    {
      columnDef: 'orderId',
      header: 'Order ID',
      cell: (element) => ('id' in element ? `${element.id}` : ''),
    },
    {
      columnDef: 'side',
      header: 'Side',
      cell: (element) => ('side' in element ? `${element.side}` : ''),
    },
    {
      columnDef: 'size',
      header: 'Size',
      cell: ({ size }) => `${size}`,
    },
    {
      columnDef: 'openTime',
      header: 'Open Time',
      cell: (element) =>
        'openTime' in element
          ? this._dateTimeFormat.format(element.openTime).replaceAll('/', '.')
          : '',
    },
    {
      columnDef: 'openPrice',
      header: 'Open Price',
      cell: ({ openPrice }) => `${this._getRoundedValue(openPrice)}`,
    },
    {
      columnDef: 'swap',
      header: 'Swap',
      cell: ({ swap }) => `${swap}`,
    },
    {
      columnDef: 'profit',
      header: 'Profit',
      cell: ({ profit }) => `${this._getRoundedValue(profit, 5)}`,
    },
  ];

  readonly displayedColumns = [
    'expand',
    ...this.columns.map(({ columnDef }) => columnDef),
    'closePosition',
  ];

  expandedElement: OrderGroup | null = null;

  expandRow(element: OrderGroup, event: Event) {
    event.stopPropagation();

    this.expandedElement = this.expandedElement === element ? null : element;
    console.log(this.expandedElement);
  }

  private _getRoundedValue(value: number, numberOfDecimals = 2) {
    const multiplier = Math.pow(10, numberOfDecimals);

    return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
  }
}

class OrdersDataSource extends DataSource<OrderGroup> {
  connect() {
    return this._getOrderGroups().pipe(tap(console.log));
  }

  disconnect() {
    console.log('disconnect');
  }

  private _getOrderGroups(): Observable<OrderGroup[]> {
    return inject(ApiService)
      .getOrders()
      .pipe(
        map((orders) => {
          const grouped = orders.reduce(
            (acc, order) => {
              if (!acc[order.symbol]) {
                acc[order.symbol] = {
                  symbol: order.symbol,
                  size: 0,
                  openPrice: 0,
                  swap: 0,
                  profit: 0,
                  items: [],
                };
              }

              const group = acc[order.symbol];
              const item: OrderWithProfit = {
                ...order,
                profit: this._getOrderProfit(order),
              };

              group.openPrice =
                (group.openPrice * group.size + item.openPrice * item.size) /
                (group.size + item.size);

              group.profit =
                (group.profit * group.size + item.profit * item.size) /
                (group.size + item.size);

              group.size += item.size;
              group.swap += item.swap;

              group.items.push(item);

              return acc;
            },
            {} as Record<OrderSymbol, OrderGroup>,
          );

          return Object.values(grouped);
        }),
      );
  }

  private _getOrderProfit({
    symbol,
    side,
    closePrice,
    openPrice,
  }: Order): number {
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

    return ((closePrice - openPrice) * multiplier * sideMultiplier) / 100;
  }
}
