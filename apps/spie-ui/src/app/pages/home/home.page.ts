import { Component, inject } from '@angular/core';
import {
  IonIcon,
  IonLabel,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/angular/standalone';

import { ConnectionComponent } from '../../components/connection/connection.component';
import { UpdateModalComponent } from '../../components/update-modal/update-modal.component';
import { ElectronService } from '../../services/electron.service';
import { ToasterService } from '../../services/toaster.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    IonIcon,
    IonLabel,
    IonTabBar,
    IonTabButton,
    IonTabs,
    ConnectionComponent,
    UpdateModalComponent,
  ],
})
export class HomePage {
  private readonly electronService = inject(ElectronService);
  private readonly toasterService = inject(ToasterService);

  onTabChange(event: { tab: string }) {
    const selectedTab = event.tab;
    if (selectedTab === 'plotter') {
      this.electronService.serialPort.getReadEncoding().then((readEncoding) => {
        if (readEncoding === 'hex') {
          this.toasterService.presentWarningToast(
            'Encoding changed to ascii for plotter'
          );
          this.electronService.serialPort.setReadEncoding('ascii');
        }
      });
    }
  }
}
