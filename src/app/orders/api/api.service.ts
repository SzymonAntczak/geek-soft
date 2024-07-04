import { Injectable, inject } from '@angular/core';
import { type Observable, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { webSocket } from 'rxjs/webSocket';

import type {
  CurrentPricesDTO,
  CurrentPricesDTOMessage,
  OrderDTO,
} from './api.model';

@Injectable()
export class ApiService {
  private readonly _http = inject(HttpClient);
  private readonly _currentPrices = webSocket<
    CurrentPricesDTO | CurrentPricesDTOMessage
  >('wss://webquotes.geeksoft.pl/websocket/quotes');

  getOrders(): Observable<OrderDTO[]> {
    return this._http
      .get<{
        data: OrderDTO[];
      }>('https://geeksoft.pl/assets/order-data.json')
      .pipe(map(({ data }) => data));
  }

  watchCurrentPrices(): Observable<CurrentPricesDTO> {
    return this._currentPrices.asObservable() as Observable<CurrentPricesDTO>;
  }

  addSymbolsToWatchList(symbols: CurrentPricesDTOMessage['d']): void {
    this._currentPrices.next({
      p: '/subscribe/addlist',
      d: symbols,
    });
  }

  removeSymbolsFromWatchList(symbols: CurrentPricesDTOMessage['d']): void {
    this._currentPrices.next({
      p: '/subscribe/removelist',
      d: symbols,
    });
  }
}
