import { Injectable, inject } from '@angular/core';
import {
  MatSnackBar,
  type MatSnackBarConfig,
} from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _defaultConfig: MatSnackBarConfig = {
    verticalPosition: 'bottom',
    horizontalPosition: 'end',
  };

  showNotification(message: string): void {
    this._openSnackBar(message, {
      ...this._defaultConfig,
      duration: 3000,
    });
  }

  showErrorNotification(message: string): void {
    this._openSnackBar(message, {
      ...this._defaultConfig,
      panelClass: 'error',
    });
  }

  private _openSnackBar(message: string, config: MatSnackBarConfig): void {
    this._snackBar.open(message, 'Zamknij', config);
  }
}
