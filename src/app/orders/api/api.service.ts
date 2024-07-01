import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Order } from './api.model';

@Injectable()
export class ApiService {
  private readonly _http = inject(HttpClient);

  getOrders(): Observable<Order[]> {
    return this._http
      .get<{
        data: Order[];
      }>('https://geeksoft.pl/assets/order-data.json')
      .pipe(map(({ data }) => data));
  }
}
