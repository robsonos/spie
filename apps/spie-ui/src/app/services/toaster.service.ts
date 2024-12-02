import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root',
})
export class ToasterService {
  private readonly toastController = inject(ToastController);

  private async presentToast(
    header: string,
    message?: string,
    color?: string
  ): Promise<void> {
    const toast = await this.toastController.create({
      header,
      message,
      duration: 3000,
      position: 'bottom',
      color,
    });

    await toast.present();
  }

  async presentInfoToast(header: string): Promise<void> {
    await this.presentToast(header, undefined);
  }

  async presentWarningToast(message: string): Promise<void> {
    await this.presentToast('Warning', message, 'warning');
  }

  async presentErrorToast(error: unknown): Promise<void> {
    await this.presentToast('Error', `${error}`, 'danger');
  }
}
