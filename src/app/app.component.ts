import { Component } from '@angular/core';
import { TransactionTableComponent } from './transaction-table/transaction-table.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TransactionTableComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {}
