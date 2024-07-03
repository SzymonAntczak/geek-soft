import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly _snackBar = inject(MatSnackBar);

  showNotification(message: string) {
    this._snackBar.open(message, 'Zamknij', {
      verticalPosition: 'bottom',
      horizontalPosition: 'end',
      duration: 3000,
    });
  }
}
