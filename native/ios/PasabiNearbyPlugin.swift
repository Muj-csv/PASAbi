// PASAbi Nearby: Multipeer Connectivity for the Capacitor app (D-033).
//
// Finds other PASAbi phones over Bluetooth and peer-to-peer Wi-Fi, connects
// to them, and moves opaque payloads (base64) both ways. It knows nothing
// about observations: the protocol is core's SyncSession, in TypeScript,
// behind packages/transport/multipeer.ts.
//
// Rules this keeps:
// - Never switches Bluetooth on. Starting the advertiser/browser is what
//   makes iOS show its own permission prompts; if Bluetooth is off, iOS
//   still finds peers over Wi-Fi when it can, and the app says so in words.
// - Foreground only (D-013): Multipeer stops when the app is suspended.
// - A peer is reported to JavaScript ("peerFound") only once its session is
//   connected, so found always means sendable.
//
// UNTESTED on a device as of 2026-09-30 (no Apple Developer account yet).

import Foundation
import Capacitor
import MultipeerConnectivity

@objc(PasabiNearbyPlugin)
public class PasabiNearbyPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PasabiNearbyPlugin"
    public let jsName = "PasabiNearby"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "send", returnType: CAPPluginReturnPromise),
    ]

    private var me: MCPeerID?
    private var session: MCSession?
    private var advertiser: MCNearbyServiceAdvertiser?
    private var browser: MCNearbyServiceBrowser?
    /** Connected peers by display name (the PASAbi device ID). */
    private var connected: [String: MCPeerID] = [:]
    private let lock = NSLock()

    @objc func start(_ call: CAPPluginCall) {
        guard let name = call.getString("displayName"), !name.isEmpty,
              let serviceType = call.getString("serviceType"), !serviceType.isEmpty else {
            call.reject("displayName and serviceType are required")
            return
        }
        DispatchQueue.main.async {
            self.tearDown()
            let peer = MCPeerID(displayName: name)
            let session = MCSession(peer: peer, securityIdentity: nil, encryptionPreference: .required)
            session.delegate = self
            let advertiser = MCNearbyServiceAdvertiser(peer: peer, discoveryInfo: nil, serviceType: serviceType)
            advertiser.delegate = self
            let browser = MCNearbyServiceBrowser(peer: peer, serviceType: serviceType)
            browser.delegate = self
            self.me = peer
            self.session = session
            self.advertiser = advertiser
            self.browser = browser
            advertiser.startAdvertisingPeer()
            browser.startBrowsingForPeers()
            call.resolve()
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.tearDown()
            call.resolve()
        }
    }

    @objc func send(_ call: CAPPluginCall) {
        guard let name = call.getString("peer"),
              let text = call.getString("data"),
              let data = Data(base64Encoded: text) else {
            call.reject("peer and base64 data are required")
            return
        }
        lock.lock()
        let target = connected[name]
        lock.unlock()
        guard let session = session, let target = target else {
            call.reject("not connected to \(name)")
            return
        }
        do {
            // Reliable: delivered in order, or the call fails. SyncSession's
            // onSent marks reports passed on only after this resolves.
            try session.send(data, toPeers: [target], with: .reliable)
            call.resolve()
        } catch {
            call.reject(error.localizedDescription)
        }
    }

    private func tearDown() {
        advertiser?.stopAdvertisingPeer()
        browser?.stopBrowsingForPeers()
        session?.disconnect()
        advertiser = nil
        browser = nil
        session = nil
        me = nil
        lock.lock()
        connected.removeAll()
        lock.unlock()
    }
}

extension PasabiNearbyPlugin: MCSessionDelegate {
    public func session(_ session: MCSession, peer peerID: MCPeerID, didChange state: MCSessionState) {
        switch state {
        case .connected:
            lock.lock()
            connected[peerID.displayName] = peerID
            lock.unlock()
            notifyListeners("peerFound", data: ["peer": peerID.displayName])
        case .notConnected:
            lock.lock()
            let known = connected.removeValue(forKey: peerID.displayName) != nil
            lock.unlock()
            if known { notifyListeners("peerLost", data: ["peer": peerID.displayName]) }
        default:
            break
        }
    }

    public func session(_ session: MCSession, didReceive data: Data, fromPeer peerID: MCPeerID) {
        notifyListeners("payload", data: ["peer": peerID.displayName, "data": data.base64EncodedString()])
    }

    public func session(_ session: MCSession, didReceive stream: InputStream, withName streamName: String, fromPeer peerID: MCPeerID) {}

    public func session(_ session: MCSession, didStartReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, with progress: Progress) {}

    public func session(_ session: MCSession, didFinishReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, at localURL: URL?, withError error: Error?) {}
}

extension PasabiNearbyPlugin: MCNearbyServiceAdvertiserDelegate {
    public func advertiser(_ advertiser: MCNearbyServiceAdvertiser,
                           didReceiveInvitationFromPeer peerID: MCPeerID,
                           withContext context: Data?,
                           invitationHandler: @escaping (Bool, MCSession?) -> Void) {
        // Every PASAbi phone accepts every PASAbi phone: observations are
        // public within the barangay, and ingest validates everything.
        invitationHandler(session != nil, session)
    }
}

extension PasabiNearbyPlugin: MCNearbyServiceBrowserDelegate {
    public func browser(_ browser: MCNearbyServiceBrowser, foundPeer peerID: MCPeerID, withDiscoveryInfo info: [String: String]?) {
        // Only the side with the smaller name invites. If both invited, iOS
        // could end up with two half-open sessions for the same pair.
        guard let me = me, let session = session, me.displayName < peerID.displayName else { return }
        browser.invitePeer(peerID, to: session, withContext: nil, timeout: 20)
    }

    public func browser(_ browser: MCNearbyServiceBrowser, lostPeer peerID: MCPeerID) {
        // Session state (.notConnected) is what reports a peer as gone.
    }
}
