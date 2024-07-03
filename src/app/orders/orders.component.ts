import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { ApiService } from './api/api.service';
import type { Column, OrderGroup } from './orders.model';
import { OrdersDataSource } from './orders-data-source';
import { CommonModule } from '@angular/common';

const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'short',
  timeStyle: 'medium',
});

function getRoundedValue(value: number, numberOfDecimals = 2): number {
  const multiplier = Math.pow(10, numberOfDecimals);

  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
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
      cell: ({ size }) => `${getRoundedValue(size)}`,
    },
    {
      columnDef: 'openTime',
      header: 'Open Time',
      cell: (element) =>
        'openTime' in element
          ? dateTimeFormat.format(element.openTime).replaceAll('/', '.')
          : '',
    },
    {
      columnDef: 'openPrice',
      header: 'Open Price',
      cell: ({ openPrice }) => `${getRoundedValue(openPrice)}`,
    },
    {
      columnDef: 'swap',
      header: 'Swap',
      cell: ({ swap }) => `${getRoundedValue(swap)}`,
    },
    {
      columnDef: 'profit',
      header: 'Profit',
      cell: ({ profit }) =>
        profit === null ? '?' : `${getRoundedValue(profit, 5)}`,
    },
  ];

  readonly displayedColumns = [
    'expand',
    ...this.columns.map(({ columnDef }) => columnDef),
    'closePosition',
  ];

  readonly expandedElements: Record<string, boolean> = {};

  expandRow(event: MouseEvent, { symbol }: OrderGroup): void {
    event.stopPropagation();

    this.expandedElements[symbol] = !this.expandedElements[symbol];
  }
}
