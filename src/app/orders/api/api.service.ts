import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, map } from 'rxjs';
import {
  type CurrentPricesWS,
  type CurrentPricesWSMessage,
  type Order,
} from './api.model';
import { webSocket } from 'rxjs/webSocket';

@Injectable()
export class ApiService {
  private readonly _http = inject(HttpClient);
  private readonly _currentPricesWS = webSocket<
    CurrentPricesWS | CurrentPricesWSMessage
  >('wss://webquotes.geeksoft.pl/websocket/quotes');

  getOrders(): Observable<Order[]> {
    return this._http
      .get<{
        data: Order[];
      }>('https://geeksoft.pl/assets/order-data.json')
      .pipe(map(({ data }) => data));
  }

  watchCurrentPrices(
    symbols: CurrentPricesWSMessage['d'],
  ): Observable<CurrentPricesWS> {
    this._currentPricesWS.next({
      p: '/subscribe/addlist',
      d: symbols,
    });

    return this._currentPricesWS.asObservable() as Observable<CurrentPricesWS>;
  }
}
