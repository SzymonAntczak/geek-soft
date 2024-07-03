import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, map } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';
import type {
  CurrentPricesWS,
  CurrentPricesWSMessage,
  Order,
} from './api.model';

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

  watchCurrentPrices(): Observable<CurrentPricesWS> {
    return this._currentPricesWS.asObservable() as Observable<CurrentPricesWS>;
  }

  addSymbolsToWatchList(symbols: CurrentPricesWSMessage['d']): void {
    this._currentPricesWS.next({
      p: '/subscribe/addlist',
      d: symbols,
    });
  }

  removeSymbolsFromWatchList(symbols: CurrentPricesWSMessage['d']): void {
    this._currentPricesWS.next({
      p: '/subscribe/removelist',
      d: symbols,
    });
  }
}
