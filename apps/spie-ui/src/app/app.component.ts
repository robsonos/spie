import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import {
  iconDeleteOutlineOutlined,
  iconDownloadingOutlined,
  iconFolderZipOutlined,
  iconHelpOutlineOutlined,
  iconHourglassBottomOutlined,
  iconIncompleteCircleOutlined,
  iconInsightsOutlined,
  iconPauseOutlined,
  iconPlayArrowOutlined,
  iconPowerOffOutlined,
  iconPowerOutlined,
  iconSendOutlined,
  iconSettingsOutlined,
  iconSpeedOutlined,
  iconTerminalOutlined,
} from '@robsonos/ionic-mdi';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    addIcons({
      iconDeleteOutlineOutlined,
      iconDownloadingOutlined,
      iconFolderZipOutlined,
      iconHelpOutlineOutlined,
      iconHourglassBottomOutlined,
      iconIncompleteCircleOutlined,
      iconInsightsOutlined,
      iconPauseOutlined,
      iconPlayArrowOutlined,
      iconPowerOffOutlined,
      iconPowerOutlined,
      iconSendOutlined,
      iconSettingsOutlined,
      iconSpeedOutlined,
      iconTerminalOutlined,
    });
  }
}
