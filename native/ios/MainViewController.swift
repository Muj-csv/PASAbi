// Registers the app-local PasabiNearby plugin with Capacitor (D-033).
// Set this as the custom class of the view controller in Main.storyboard
// (native/README.md, step 4).

import UIKit
import Capacitor

class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(PasabiNearbyPlugin())
    }
}
