import { Component, model, viewChild } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonList,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { type Delimiter, type Encoding } from '@spie/types';

import { type SendOptions } from '../../interfaces/app.interface';
import { type SelectCustomEvent } from '../../interfaces/ionic.interface';

@Component({
  selector: 'app-send-advanced-modal-component',
  templateUrl: 'send-advanced-modal.component.html',
  styleUrls: ['./send-advanced-modal.component.scss'],
  imports: [
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonItem,
    IonList,
    IonModal,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToolbar,
  ],
})
export class SendAdvancedComponent {
  sendOptions = model.required<SendOptions>();

  sendAdvancedModal = viewChild.required<IonModal>('sendAdvancedModal');

  onChangeSendEncoding(event: SelectCustomEvent<Encoding>): void {
    const selectedOption = event.detail.value;
    this.sendOptions.update((sendOptions) => ({
      ...sendOptions,
      encoding: selectedOption,
    }));
  }

  onChangeDelimiter(event: SelectCustomEvent<Delimiter>): void {
    const selectedOption = event.detail.value;
    this.sendOptions.update((sendOptions) => ({
      ...sendOptions,
      delimiter: selectedOption,
    }));
  }
}
