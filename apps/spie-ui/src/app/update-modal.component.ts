import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, input } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonProgressBar,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { type AutoUpdaterEvent } from '@spie/types';

import { ElectronService } from './electron.service';

@Component({
  selector: 'app-dfu-progress',
  templateUrl: './update-modal.component.html',
  styleUrls: ['./update-modal.component.scss'],
  standalone: true,
  imports: [
    DecimalPipe,
    IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonHeader,
    IonProgressBar,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
})
export class UpdateModalComponent {
  private readonly modalController: ModalController = inject(ModalController);
  private readonly electronService = inject(ElectronService);

  autoUpdaterEvent = input.required<AutoUpdaterEvent>();
  progressInfo = computed(() => {
    const autoUpdaterEvent = this.autoUpdaterEvent();
    if (autoUpdaterEvent?.event === 'download-progress') {
      return autoUpdaterEvent.progressInfo;
    }

    return {
      total: 0,
      delta: 0,
      transferred: 0,
      percent: 0,
      bytesPerSecond: 0,
    };
  });

  constructor() {
    this.electronService.downloadUpdate();

    effect(async () => {
      const autoUpdaterEvent = this.autoUpdaterEvent();
      if (
        autoUpdaterEvent.event === 'update-downloaded' ||
        autoUpdaterEvent.event === 'update-cancelled' ||
        autoUpdaterEvent.event === 'error'
      ) {
        await this.modalController.dismiss();
      }
    });
  }

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
}
