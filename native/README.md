# PASAbi native app (Bluetooth pass-on, D-033)

The PWA in `web/` works in any browser, but a browser **cannot** use Bluetooth between phones: iOS Safari has no Web Bluetooth at all. The native app wraps the same build with [Capacitor](https://capacitorjs.com) and adds one plugin, `PasabiNearby`. It finds nearby PASAbi phones over Bluetooth and peer-to-peer Wi-Fi using Apple's Multipeer Connectivity.

What the app does with it:
- **On start:** asks once whether to use Bluetooth. "Allow" starts the radio, which is what makes iOS show its own Bluetooth / Local Network prompts. The app never switches Bluetooth on itself.
- **On Pass on, under the QR:**
  - a radar shows the phones in range
  - **Ping nearby** runs core's `SyncSession` with every one of them at once, most urgent reports first
  - reports are stamped "passed on" only for batches that actually went out

**Status: written, not yet run on a device.** It needs everything below.

## What you need

- An **Apple Developer Program** membership. It's needed to install on iPhones; a free account can install to your own phone from Xcode for 7 days.
- **A Mac with Xcode 16+**, or a cloud Mac build (Codemagic, Ionic Appflow, GitHub Actions `macos-latest`).
- **Two or more iPhones** on iOS 16+. Multipeer does not work in the Simulator between two simulators reliably.

## Set up (on the Mac)

1. Build the web app, then add the iOS platform:
   ```bash
   npm ci
   npm run web:build
   npx cap add ios
   npx cap sync ios
   ```
2. In Xcode (`npx cap open ios`), add **both files** from `native/ios/` (`PasabiNearbyPlugin.swift` and `MainViewController.swift`) to the **App** target.
3. Add the permission texts and the Bonjour service to `ios/App/App/Info.plist`:
   ```xml
   <key>NSBluetoothAlwaysUsageDescription</key>
   <string>PASAbi passes reports to phones near you by Bluetooth. No internet needed.</string>
   <key>NSLocalNetworkUsageDescription</key>
   <string>PASAbi finds nearby PASAbi phones to pass reports to them.</string>
   <key>NSBonjourServices</key>
   <array>
     <string>_pasabi-obs._tcp</string>
     <string>_pasabi-obs._udp</string>
   </array>
   <key>NSCameraUsageDescription</key>
   <string>PASAbi scans the QR code on another phone to receive reports.</string>
   <key>NSLocationWhenInUseUsageDescription</key>
   <string>PASAbi attaches where you are to a report, if it can find it.</string>
   ```
   The service name must match `SERVICE_TYPE` in `packages/transport/multipeer.ts`.
4. In `Main.storyboard`, select the Bridge View Controller and set its **Custom Class** to `MainViewController`. That registers the plugin.
5. Set your Team under **Signing & Capabilities**, pick an iPhone, and Run.

After any web change: `npm run web:build && npx cap sync ios`.

## First test

This is the acceptance check for R6.

1. Install on two iPhones. Open PASAbi on both and tap **Allow Bluetooth**, then allow the iOS prompts.
2. Turn on airplane mode on both, then turn Bluetooth back on. Airplane mode switches Bluetooth off; iOS lets you re-enable it.
3. On phone A, record a report, then open **Pass on**. Within a few seconds the radar should show one dot, "1 phone in range".
4. Tap **Ping nearby**. It should show "Passed on to 1 phone". Phone B's My reports → Carrying shows A's report, and A's slip gets a PASSED ON stamp.
5. Record the time it took in `docs/FIELD_TEST.md`.

## Limits

- **Foreground only (D-013).** A phone must have PASAbi open to be found and to receive.
- **iPhone to iPhone only.** Android would need a Nearby Connections plugin behind the same `Transport` interface. That's not written, and there are no Android phones in the team (D-019).
- **No distance or direction.** Multipeer does not report signal strength, so the radar shows who is in range, not where.
- **Everyone accepts everyone,** as with QR. Anything received still goes through `receiveObservations()`, which validates it.
