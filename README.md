<p align="center">
  <img src="./docs/logo.png" width="500">
<h3 align="center"> SPIE</h3>
</p>
<p align="center">
  <img src="https://img.shields.io/maintenance/yes/2024?style=flat-square"/>
  <a href="https://github.com/robsonos/spie/releases" style="color: inherit; text-decoration: none;">
    <img alt="GitHub Release" src="https://img.shields.io/github/v/release/robsonos/spie">
  </a>
  <a
    href="https://github.com/robsonos/spie/actions/workflows/ci.yml"
    style="color: inherit; text-decoration: none;">
    <img
      alt="GitHub Workflow Status (with event)"
      src="https://img.shields.io/github/actions/workflow/status/robsonos/spie/ci.yml"/>
  </a>
</p>
<p align="center">
  <a href="LICENSE" style="color: inherit; text-decoration: none;">
    <img alt="GitHub License" src="https://img.shields.io/github/license/robsonos/spie">
  </a>
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
  <a href="#contributors" style="color: inherit; text-decoration: none;">
    <img
      alt="GitHub contributors from allcontributors.org"
      src="https://img.shields.io/badge/all_contributors-0-orange.svg?style=flat-square"/>
  </a>
<!-- ALL-CONTRIBUTORS-BADGE:END -->
</p>

This repository helps you quickly set up and develop your serial port communication project. Built with **ElectronJS** and a modern **Ionic/Angular** front-end, it uses an **NX monorepo** structure for efficient project management.

The repository provides:

- Core functionality of Arduino's Serial Monitor, enhanced with tools to configure, monitor, and communicate with serial devices
- Core functionality of Arduino's Serial Plotter, enhanced with tools to select, zoom, export and visualize data
- Cross-platform desktop application (`windows`, `linux` and `macOS`)
- Hot-reloading to accelerate development and testing cycles
- Enforced code linting and formatting
- Enforced conventional commits
- Streamlined workspace management and remote caching with [NX](https://nx.dev/)
- CI/CD and Release pipelines with local testing
- Angular's signals and RxJS for reactivity and state management
- Unit testing examples
- E2E testing examples
- Automatic updates on new github releases (see [limitations](#limitations) for more details)
- Modern tech stack:
  | Package | version |
  | ---------- | ------- |
  | nodejs | 22.x.x |
  | angular | 19.x.x |
  | ionic | 8.x.x |
  | electron | 33.3.x |
  | nx | 20.2.2 |
  | typescript | 5.5.x |

For a demo, check the [sample binaries](https://github.com/robsonos/spie/releases).

## Index

- [Features](#features)
- [Getting started](#getting-started)
- [Nx tasks](#nx-tasks)
- [CD/CI/Release workflow](#cdcirelease-workflow)
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

Firstly, ensure the following are installed:

- [Node.js](https://nodejs.org) (preferably using `nvm` for version management)
- [NX CLI](https://nx.dev) (`npm install -g nx`, or you can use `npx nx ...` if you prefer)

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

const uint8_t numPhases = 12;           // Number of variables (1, 2, or 3)
const uint16_t signalFrequency = 1;     // Frequency of the sine wave in Hz
const uint16_t samplingFrequency = 500; // Sampling frequency in Hz (up to 500Hz)
const int16_t amplitude = 1000;         // Amplitude of the sine wave
const int16_t offset = 0;               // Offset for the sine wave (to make it positive)
const float errorPercentage = 0;        // Configurable error percentage (5.0 means ±5%)
bool addTime = false;

// Calculated Constants
const uint16_t pointsPerWave = samplingFrequency / signalFrequency;
const uint32_t samplingInterval = 1000000 / samplingFrequency;

void setup()
{
    // Initialize serial communication
    Serial.begin(115200);
    pinMode(0, INPUT);
    randomSeed(analogRead(0)); // Initialize random seed
}

void loop()
{
    static uint32_t lastSampleTime = 0;
    static uint16_t pointIndex = 0;
    uint32_t currentMicros = micros();
    uint32_t elapsedSampleTime = currentMicros - lastSampleTime;

    // Check if it's time for the next sample
    if (elapsedSampleTime >= samplingInterval)
    {
        lastSampleTime = currentMicros;

        // Build the output string
        String output = "";

        if (addTime)
        {
            output += String(elapsedSampleTime) + "\t";
        }

        // Generate and append up to numPhases sine wave values
        for (int phase = 0; phase < numPhases; ++phase)
        {
            float phaseShift = (2.0 * PI / numPhases) * phase; // Phase shift for multi-phase signals
            float radians = 2.0 * PI * pointIndex / pointsPerWave + phaseShift;
            int sineValue = offset + amplitude * sin(radians);

            // Add random error
            float errorFactor = random(-1000, 1001) / 1000.0;
            int error = sineValue * (errorFactor * (errorPercentage / 100.0));
            sineValue += error;

            output += String(sineValue);
            if (phase < numPhases - 1)
            {
                output += "\t"; // Tab delimiter for intermediate values
            }
        }

        // Print the entire string in one call
        Serial.println(output);

        // Move to the next point
        pointIndex = (pointIndex + 1) % pointsPerWave;
    }
}
```

[Back to Index](#index)

## NX tasks

Learn more about NX in this [Angular Monorepo tutorial](https://nx.dev/getting-started/tutorials/angular-monorepo-tutorial?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects).
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

- Run e2e tests:

```sh
nx run-many -t e2e
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

## CD/CI/Release workflow

There are many ways CD/CI/Release workflow can be implemented. I chose the most convenient one and here is how it is meant to work:

- `dev`: holds the development code. Pushes to this will trigger the `CI workflow`, test your code, and create a PR to merge it into `main`.
- `main`: holds the code for the latest release. Pushes to this will trigger the `CD workflow` and create a new github release and tag. You should never need to push commits to `main`; use `dev` and create a PR instead. The code on this branch should always come from merges from `dev`.
- Once a new release is done, the `Release` workflow will be triggered to build and add the binaries to the release.
- If you need to maintain more release channels, like `main` is at `v3.x.x` but you need to support `v1.x.x`, I would recommend using a similar approach:
  - `main` for `v3.x.x`
  - `main/v1` for `v1.x.x`
  - `dev` for `v3.x.x` development
  - `dev/v1` for `v1.x.x` development
- I may look into exemplifying the above and `pre-releases` in the feature

### act

You can use [act](https://github.com/nektos/act) to test workflows locally. Read more about `act` [here](https://nektosact.com/). Also, check out [.actrc](.actrc)

- CI

```shell
act push -W .github/workflows/ci.yml
```

- CD

```shell
act push -W .github/workflows/cd.yml
```

- Release

```shell
act release -W .github/workflows/release.yml -e  event.json
```

Sample `event.json`

```json
{
  "action": "created",
  "release": {
    "name": "v1.0.0",
    "tag_name": "1.0.0"
  }
}
```

[Back to Index](#index)

## Troubleshooting

- Serial data may be delivered in more than one `.on('data')` event. This means data received by the serialport library might arrive in multiple packets. For details, see [node-serialport/issues/659](https://github.com/serialport/node-serialport/issues/659). This is not a problem in most cases, but unexpected behavior may occur if you are trying to monitor data at a fast rate. A good way to demonstrate the issues is to send data every `5ms`, `115200` baud rate and with `show timestamps`. You will notice that every so often there is a "broken" message. If your data is terminated with a new line (`\n`) you can use `use readline parser` to alleviate that. If you are developing your own application, I would recommend using one of the [parsers](https://serialport.io/docs/api-parsers-overview) available.
- Depending on your operating system, the serial port ingestion may take a while, which could make the `plotter` look off when using `timestamp` instead of `sample count`.
- `macOS` application must be signed in order for auto updating to work. See [electron-builder Auto Update](https://www.electron.build/auto-update) for more details.

[Back to Index](#index)

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

[Back to Index](#index)
