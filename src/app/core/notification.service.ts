import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly _snackBar = inject(MatSnackBar);

  showNotification(message: string, isError = false) {
    this._snackBar.open(message, 'Zamknij', {
      verticalPosition: 'bottom',
      horizontalPosition: 'end',
      duration: isError ? undefined : 3000,
      panelClass: isError ? 'error' : '',
    });
  }
}
