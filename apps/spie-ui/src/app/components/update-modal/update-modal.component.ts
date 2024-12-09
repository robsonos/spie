import { DecimalPipe } from '@angular/common';
import { Component, inject, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  type AlertButton,
  AlertController,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonProgressBar,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { type ProgressInfo } from 'electron-updater';
import { of, switchMap, tap } from 'rxjs';

import { ElectronService } from '../../services/electron.service';
import { ToasterService } from '../../services/toaster.service';

@Component({
  selector: 'app-update-modal',
  templateUrl: 'update-modal.component.html',
  styleUrls: ['./update-modal.component.scss'],
  standalone: true,
  imports: [
    DecimalPipe,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonModal,
    IonNote,
    IonProgressBar,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
})
export class UpdateModalComponent {
  private readonly electronService = inject(ElectronService);
  private readonly toasterService = inject(ToasterService);
  private readonly alertController = inject(AlertController);

  progressInfo = toSignal(
    this.electronService.onUpdateEvent().pipe(
      tap(async (autoUpdaterEvent) => {
        if (autoUpdaterEvent.type === 'error') {
          await this.toasterService.presentErrorToast(autoUpdaterEvent.error);
        }

        if (autoUpdaterEvent.type === 'checking-for-update') {
          await this.toasterService.presentInfoToast('Checking for Updates');
        }

        if (autoUpdaterEvent.type === 'update-not-available') {
          await this.toasterService.presentInfoToast('No Updates Available');
        }

        if (autoUpdaterEvent.type === 'update-available') {
          await this.presentAlert(
            'Update Available for Download',
            `Version ${autoUpdaterEvent.updateInfo.version} is ready for download.`,
            [
              {
                text: 'Cancel',
                role: 'cancel',
              },
              {
                text: 'Download',
                role: 'confirm',
                handler: async () => {
                  this.electronService.downloadUpdate();
                  await this.updateModal().present();
                },
              },
            ]
          );
        }

        if (autoUpdaterEvent.type === 'update-downloaded') {
          await this.presentAlert(
            'Update Ready to Install',
            `Version ${autoUpdaterEvent.updateDownloadedEvent.version} is ready to install.`,
            [
              {
                text: 'Cancel',
                role: 'cancel',
              },
              {
                text: 'Install',
                role: 'confirm',
                handler: () => {
                  this.electronService.installUpdate();
                },
              },
            ]
          );
        }

        if (autoUpdaterEvent.type === 'update-cancelled') {
          await this.toasterService.presentErrorToast('Update Cancelled');
        }

        if (
          autoUpdaterEvent.type === 'update-downloaded' ||
          autoUpdaterEvent.type === 'update-cancelled' ||
          autoUpdaterEvent.type === 'error'
        ) {
          await this.updateModal().dismiss();
        }
      }),
      switchMap((autoUpdaterEvent) => {
        if (autoUpdaterEvent.type === 'download-progress') {
          return of(autoUpdaterEvent.progressInfo);
        }

        return of({
          total: 0,
          delta: 0,
          transferred: 0,
          percent: 0,
          bytesPerSecond: 0,
        });
      })
    ),
    {
      initialValue: {
        total: 0,
        delta: 0,
        transferred: 0,
        percent: 0,
        bytesPerSecond: 0,
      } as ProgressInfo,
    }
  );

  updateModal = viewChild.required<IonModal>('updateModal');

  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  getEstimatedTime(): string {
    const progress = this.progressInfo();
    if (progress.bytesPerSecond === 0) {
      return 'Calculating...';
    }

    const remainingBytes = progress.total - progress.transferred;
    const remainingSeconds = remainingBytes / progress.bytesPerSecond;

    if (remainingSeconds < 60) {
      // Less than 1 minute
      return `${Math.round(remainingSeconds)} seconds`;
    } else {
      // 1 minute or more
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = Math.round(remainingSeconds % 60);
      return `${minutes}m ${seconds}s`;
    }
  }

  private async presentAlert(
    header: string,
    message?: string,
    buttons?: (AlertButton | string)[]
  ): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons,
    });
    await alert.present();
  }
}
