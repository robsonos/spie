<p align="center">
  <img src="./docs/logo.png" width="500">
<h3 align="center"> SPIE</h3>
</p>
<p align="center">
  <img src="https://img.shields.io/maintenance/yes/2024?style=flat-square"/>
  <a href="https://github.com/robsonos/spie/actions/workflows/ci.yml">
    <img
      alt="GitHub Workflow Status (with event)"
      src="https://img.shields.io/github/actions/workflow/status/robsonos/spie/ci.yml"/>
  </a>
  <a href="LICENSE">
    <img alt="GitHub License" src="https://img.shields.io/github/license/robsonos/spie">
  </a>
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
  <a href="#contributors">
    <img
      alt="GitHub contributors from allcontributors.org"
      src="https://img.shields.io/badge/all_contributors-0-orange.svg?style=flat-square"/>
  </a>
<!-- ALL-CONTRIBUTORS-BADGE:END -->
</p>

This repository helps you quickly set up and develop your serial port communication project. Built with **ElectronJS** and a modern **Ionic/Angular** front-end, it uses an **NX monorepo** structure for efficient project management.

The repository provides:

- Core functionality of Arduino's Serial Monitor (legacy editor) enhanced with tools to configure, monitor, and communicate with serial devices.
- Designed for developers and hobbyists working on serial communication projects.
- Includes **hot-reloading** for seamless development.
- Streamlined workspace management with [NX](https://nx.dev/). Learn more in this [Angular Monorepo tutorial](https://nx.dev/getting-started/tutorials/angular-monorepo-tutorial?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects).
- Hot-reloading accelerates development and testing cycles.
- Modern tech stack:

| Package  | version |
| -------- | ------- |
| nodejs   | 22.x.x  |
| angular  | 19.x.x  |
| ionic    | 8.x.x   |
| electron | 33.3.x  |
| nx       | 20.2.2  |

## Index

- [Features](#features)
- [Getting started](#getting-started)
- [Nx tasks](#nx-tasks)
- [Troubleshooting](#troubleshooting)

## Features

<p align="center"><br><img src="./docs/demo.gif" width="500"></p>

- **Port Configuration**

  - **Port Selection:** Displays available serial ports with details like path and manufacturer.
  - **Baud Rate:** Match your serial device configuration with flexible baud rate selection.
  - **Connect/Disconnect Control:** Toggle the connection with a single click.
  - **Advanced Settings:**
    - **Data Bits:** Choose from 5, 6, 7, or 8 data bits.
    - **Stop Bits:** Options include 1, 1.5, or 2 stop bits.
    - **Parity:** Support for None, Even, and Odd parity.
    - **Flow Control:** Configure RTS/CTS, XON/XOFF, XANY, and HUPCL settings.

- **Terminal**

  - **Display Incoming Data:** View serial data in a user-friendly terminal.
  - **Clear Terminal:** Clear the terminal display at any time.
  - **Advanced Display Options:**
    - **Encoding:** Display data in ASCII or Hex.
    - **Auto Scroll:** Automatically scroll to display the latest data.
    - **Show Timestamps:** Enable timestamps for incoming data.
    - **Scrollback Size:** Adjust scrollback length to retain a custom amount of data history.

- **Sending Data**
  - **Quick Input:** Type and send data instantly.
  - **Advanced Send Options:**
    - **Encoding:** ASCII or Hex support.
    - **Delimiter:** Append CR, LF, CRLF, or send data as-is.

[Back to Index](#index)

## Getting Started

To set up the repository, ensure the following are installed:

- [Node.js](https://nodejs.org) (preferably using `nvm` for version management)
- [NX CLI](https://nx.dev) (`npm install -g nx`)

### Steps

1. Clone the repository:

```sh
git clone https://github.com/robsonos/spie
cd spie
```

2. Install dependencies:

```sh
npm i
```

3. Run the application:

```sh
nx run-many -t serve
```

### Sample Arduino code

For testing the application, use this Arduino code:

```cpp
#include <Arduino.h>

int period = 1000;
unsigned long time_now = 0;

void setup() {
  Serial.begin(9600);
}

void loop() {
  if (Serial.available() > 0)
    Serial.write(Serial.read());

  if (millis() > time_now + period) {
    time_now = millis();
    Serial.print("Hello World ");
    Serial.println(millis());
  }
}
```

[Back to Index](#index)

## NX tasks

Here are the most commonly used NX tasks:

- Serve the applications:

```sh
nx run-many -t serve
```

- Lint the code:

```sh
nx run-many -t lint
```

- Run unit tests:

```sh
nx run-many -t test
```

- Build the applications (development):

```sh
nx run-many -t build

```

- Build the applications (production):

```sh
nx run-many -t build --prod
```

- Build and generate unpacked executables:

> [!WARNING]
> Build the applications first

```sh
nx run spie:package
```

Output files are located in `dist\packages`

- Build and generate the executables:

> [!WARNING]
> Build the applications first

```sh
 nx run spie:make
```

Output files are located in `dist\executables`

[Back to Index](#index)

## Troubleshooting

### Known issues

- Serial data may be delivered in more than one `.on('data')` event. This means data received by the serialport library might arrive in multiple packets. For details, see [node-serialport/issues/659](https://github.com/serialport/node-serialport/issues/659) for more information. This is not a problem in most cases, but things may start looking strange if you are trying to monitor data at a fast rate. A good way to demonstrate the issues is to send data every `5ms`, `115200` baud rate and with `show timestamps`. You will notice that every so often there is a "broken" message. If you are developing your own application, I would recommend having a specific line terminator and use one of the [parsers](https://serialport.io/docs/api-parsers-overview) available.

### Limitations

- Due to the issue where serial data may be delivered in more than on `.on('data'` event (see [known issues](#known-issues)), enabling "Show Timestamps" may result in fragmented messages at high transmission rates. An [InterByteTimeoutParser](https://serialport.io/docs/api-parser-inter-byte-timeout) with `interval: 5` was used to alleviate that.

[Back to Index](#index)

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

[Back to Index](#index)
