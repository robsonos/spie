import { Component, inject, viewChild } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import { MonitorComponent } from '../../../components/monitor/monitor.component';
import { SendComponent } from '../../../components/send/send.component';
import { ElectronService } from '../../../services/electron.service';

@Component({
  selector: 'app-monitor',
  templateUrl: 'monitor.page.html',
  styleUrls: ['./monitor.page.scss'],
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    SendComponent,
    MonitorComponent,
  ],
})
export class MonitorPage {
  private readonly electronService = inject(ElectronService);
  monitorComponent = viewChild.required(MonitorComponent);

  ionViewWillEnter() {
    this.electronService.serialPort.getReadEncoding().then((readEncoding) => {
      this.monitorComponent().monitorOptions.update((monitorOptions) => ({
        ...monitorOptions,
        encoding: readEncoding,
      }));
    });
  }
}
