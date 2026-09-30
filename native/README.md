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

1. Install on two iPhones. Open PASAbi on both: the **Before you start** sheet asks for Bluetooth and Location. Tap **Allow**, then allow the iOS prompts (and turn Bluetooth on if iOS offers).
2. Turn on airplane mode on both, then turn Bluetooth back on. Airplane mode switches Bluetooth off; iOS lets you re-enable it.
3. On phone A, record a report, then open **Pass on**. Within a few seconds the radar should show one dot, "1 phone in range".
4. On phone B open **Receive**: it shows "Waiting for nearby phones to ping." On A tap **Ping nearby** (the main button on Pass on). A shows "Passed on to 1 phone"; B shows "Got N by Bluetooth · M new", and A's slip gets a PASSED ON stamp.
5. Record the time it took in `docs/FIELD_TEST.md`.

## Turning Bluetooth on (why the app can't, and what it does instead)

**iPhone:** iOS has no API that lets an app switch Bluetooth on, and forcing it would get the app rejected. `CLAUDE.md` forbids it too. So PASAbi asks:
- **Allow** asks iOS, which shows its permission prompt the first time.
- **Whenever Bluetooth is off:** Allow shows iOS's own "Turn On Bluetooth" alert again (a fresh `CBCentralManager` with `ShowPowerAlert`). That alert's Settings button opens Bluetooth settings.
- **The sheet explains:** "Swipe down from the top right, tap Bluetooth."
- **After "Don't Allow":** iOS never asks again, so **Open Settings** goes to PASAbi's page in Settings.
- **When the person turns Bluetooth on,** the app notices (`bluetoothState`) and starts by itself.

**Android: planned, not built (D-034).** Android *can* do what was asked: a system dialog, "PASAbi wants to turn on Bluetooth", and one tap on **Allow** switches it on. When there is an Android build:
1. Write a `PasabiNearby` Capacitor plugin for Android with the **same JavaScript API**: `requestBluetooth`, `openSettings`, `start`, `stop`, `send`, and the same events. Then `packages/transport/multipeer.ts` and every screen work unchanged.
2. `requestBluetooth`:
   1. On Android 12+, request `BLUETOOTH_SCAN`, `BLUETOOTH_ADVERTISE`, `BLUETOOTH_CONNECT` (and `NEARBY_WIFI_DEVICES` on 13+). On older versions, `ACCESS_FINE_LOCATION`.
   2. If the adapter is off, launch `BluetoothAdapter.ACTION_REQUEST_ENABLE`. That intent is the system "turn on Bluetooth" dialog; `BluetoothAdapter.enable()` is deprecated and not allowed for apps.
   3. Resolve `on` on `RESULT_OK`, `off` otherwise.

   ```kotlin
   @PluginMethod
   fun requestBluetooth(call: PluginCall) {
       val adapter = (context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager).adapter
           ?: return call.resolve(JSObject().put("state", "unsupported"))
       if (adapter.isEnabled) return call.resolve(JSObject().put("state", "on"))
       // The system dialog: "PASAbi wants to turn on Bluetooth" [Deny] [Allow]
       startActivityForResult(call, Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE), "onEnableResult")
   }

   @ActivityCallback
   private fun onEnableResult(call: PluginCall, result: ActivityResult) {
       call.resolve(JSObject().put("state", if (result.resultCode == Activity.RESULT_OK) "on" else "off"))
   }
   ```
3. The transport is Google **Nearby Connections**, `Strategy.P2P_CLUSTER`, with service ID `pasabi-obs`: advertise and discover, auto-accept, `Payload.fromBytes`.
4. iPhones and Android phones **cannot see each other** over radio (D-012): Multipeer and Nearby Connections don't interoperate. They meet through QR and the cloud.

## Limits

- **Foreground only (D-013).** A phone must have PASAbi open to be found and to receive.
- **iPhone to iPhone only.** Android would need a Nearby Connections plugin behind the same `Transport` interface. That's not written, and there are no Android phones in the team (D-019).
- **No distance or direction.** Multipeer does not report signal strength, so the radar shows who is in range, not where.
- **Everyone accepts everyone,** as with QR. Anything received still goes through `receiveObservations()`, which validates it.
