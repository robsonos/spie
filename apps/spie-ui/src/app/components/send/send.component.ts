import { Component, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCol,
  IonGrid,
  IonIcon,
  IonInput,
  IonItem,
  IonRow,
  IonText,
} from '@ionic/angular/standalone';
import { type Delimiter } from '@spie/types';
import { scan } from 'rxjs';

import { type IonInputCustomEvent } from '../../interfaces/ionic.interface';
import { ElectronService } from '../../services/electron.service';
import { SerialPortService } from '../../services/serial-port.service';
import { ToasterService } from '../../services/toaster.service';
import { SendAdvancedComponent } from '../send-advanced-modal/send-advanced-modal.component';

@Component({
  selector: 'app-send-component',
  templateUrl: 'send.component.html',
  styleUrls: ['./send.component.scss'],
  imports: [
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCol,
    IonGrid,
    IonIcon,
    IonInput,
    IonItem,
    IonRow,
    IonText,
    SendAdvancedComponent,
  ],
})
export class SendComponent {
  private readonly toasterService = inject(ToasterService);
  private readonly electronService = inject(ElectronService);
  private readonly serialPortService = inject(SerialPortService);

  constructor() {
    toObservable(this.sendOptions)
      .pipe(
        takeUntilDestroyed(),
        scan((currentSendOptions, sendOptions) => {
          // Reset input field if encoding changes
          if (currentSendOptions.encoding !== sendOptions.encoding) {
            this.sendInput().value = '';
          }

          return sendOptions;
        })
      )
      .subscribe();
  }

  isOpen = this.serialPortService.isOpen;
  sendOptions = this.serialPortService.sendOptions;

  private sendInput = viewChild.required<IonInput>('sendInput');
  private sendAdvancedComponent = viewChild.required(SendAdvancedComponent);

  async onClickSend(): Promise<void> {
    const rawData = this.sendInput().value as string;
    if (rawData) {
      const formatHexData = (data: string): string => data.replace(/\s+/g, '');
      const formatDelimitedData = (data: string): string => {
        const delimiterMap: Record<Delimiter, string> = {
          none: '',
          cr: '\r',
          lf: '\n',
          crlf: '\r\n',
        };
        return data.concat(delimiterMap[this.sendOptions().delimiter]);
      };

      const data =
        this.sendOptions().encoding === 'hex'
          ? formatHexData(rawData)
          : formatDelimitedData(rawData);

      try {
        const canHandleMoreData = await this.electronService.serialPort.write(
          data,
          this.sendOptions().encoding
        );

        if (!canHandleMoreData) {
          await this.toasterService.presentWarningToast(
            'Write buffer is full!'
          );
        }
      } catch (error) {
        await this.toasterService.presentErrorToast(error);
      }
    }
  }

  onChangeSendInput(event: IonInputCustomEvent): void {
    const inputValue = event.detail.value;
    if (!inputValue) {
      this.sendOptions.update((sendOptions) => ({
        ...sendOptions,
        isSendInputValid: false,
      }));
      return;
    }

    if (this.sendOptions().encoding !== 'hex') {
      this.sendOptions.update((sendOptions) => ({
        ...sendOptions,
        isSendInputValid: true,
      }));
      return;
    }

    const formattedHexValue =
      inputValue
        .replace(/[^a-fA-F0-9]/g, '')
        .toUpperCase()
        .match(/.{1,2}/g)
        ?.join(' ') ?? '';
    event.target.value = formattedHexValue;
    const isEvenLength = formattedHexValue.replace(/\s+/g, '').length % 2 === 0;
    this.sendOptions.update((sendOptions) => ({
      ...sendOptions,
      isSendInputValid: isEvenLength,
    }));
  }

  async onClickSendAdvancedModal() {
    this.sendAdvancedComponent().sendAdvancedModal().present();
  }
}
