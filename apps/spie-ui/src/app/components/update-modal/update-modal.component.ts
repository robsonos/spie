import { DecimalPipe } from '@angular/common';
import { Component, input, viewChild } from '@angular/core';
import {
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

@Component({
  selector: 'app-update-modal',
  templateUrl: './update-modal.component.html',
  styleUrls: ['./update-modal.component.scss'],
  standalone: true,
  imports: [
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
    IonToolbar,
    DecimalPipe,
  ],
})
export class UpdateModalComponent {
  updateModal = viewChild.required<IonModal>('updateModal');

  progressInfo = input.required<ProgressInfo>();

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
