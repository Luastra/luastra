import AVFoundation
import Capacitor
import Foundation
import MediaPlayer
import UIKit

@objc(LuastraMediaPlugin)
public final class LuastraMediaPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LuastraMediaPlugin"
    public let jsName = "LuastraMedia"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "command", returnType: CAPPluginReturnPromise)
    ]

    private let player = AVPlayer()
    private var periodicObserver: Any?
    private var observers: [NSObjectProtocol] = []
    private var itemStatusObservation: NSKeyValueObservation?
    private var timeControlObservation: NSKeyValueObservation?
    private var remoteCommandTargets: [(MPRemoteCommand, Any)] = []
    private var lastErrorCode: String?
    private var hasStarted = false
    private var wantsPlayback = false

    override public func load() {
        configureAudioSession()
        configureRemoteCommands()
        observePlayer()
        observeAudioSession()
    }

    deinit {
        if let periodicObserver {
            player.removeTimeObserver(periodicObserver)
        }
        observers.forEach(NotificationCenter.default.removeObserver)
        remoteCommandTargets.forEach { command, target in command.removeTarget(target) }
    }

    @objc public func command(_ call: CAPPluginCall) {
        let operation = call.getString("operation", "")
        switch operation {
        case "load":
            guard let source = call.getString("source"), let url = admittedURL(source) else {
                call.reject("Media source must be secure remote or admitted local content", "MEDIA_SOURCE")
                return
            }
            let item = AVPlayerItem(url: url)
            observeItem(item)
            player.replaceCurrentItem(with: item)
            lastErrorCode = nil
            hasStarted = false
            wantsPlayback = false
            updateNowPlaying(title: call.getString("title", ""), artist: call.getString("artist", ""))
        case "play":
            do {
                try AVAudioSession.sharedInstance().setActive(true)
                startPlayback()
            } catch {
                call.reject("Unable to activate playback audio session", "MEDIA_AUDIO_SESSION", error)
                return
            }
        case "pause":
            wantsPlayback = false
            player.pause()
        case "seek":
            let milliseconds = max(0, call.getDouble("positionMs", 0))
            player.seek(to: CMTime(seconds: milliseconds / 1000, preferredTimescale: 1000), toleranceBefore: .zero, toleranceAfter: .zero)
        case "stop":
            player.pause()
            player.seek(to: .zero)
            hasStarted = false
            wantsPlayback = false
        case "unload":
            player.pause()
            player.replaceCurrentItem(with: nil)
            itemStatusObservation = nil
            hasStarted = false
            wantsPlayback = false
            lastErrorCode = nil
            MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
        case "state":
            break
        default:
            call.reject("Unsupported media operation", "MEDIA_OPERATION")
            return
        }
        let state = snapshot()
        call.resolve(state)
        notifyListeners("stateChange", data: state)
    }

    private func admittedURL(_ source: String) -> URL? {
        guard let url = URL(string: source), let scheme = url.scheme?.lowercased() else { return nil }
        if scheme == "file" { return url }
        if (scheme == "https" || scheme == "capacitor"), url.host?.lowercased() == "localhost" {
            let path = url.path.removingPercentEncoding ?? url.path
            guard path.hasPrefix("/assets/"), !path.split(separator: "/").contains(".."), let resourceRoot = Bundle.main.resourceURL else { return nil }
            return resourceRoot.appendingPathComponent("public", isDirectory: true).appendingPathComponent(String(path.dropFirst()))
        }
        return scheme == "https" ? url : nil
    }

    private func configureAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [])
        } catch {
            lastErrorCode = "MEDIA_AUDIO_SESSION"
        }
    }

    private func observePlayer() {
        timeControlObservation = player.observe(\.timeControlStatus, options: [.new]) { [weak self] _, _ in
            self?.emitState()
        }
        periodicObserver = player.addPeriodicTimeObserver(
            forInterval: CMTime(seconds: 0.25, preferredTimescale: 1000),
            queue: .main
        ) { [weak self] _ in
            self?.emitState()
        }
        observers.append(NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: nil,
            queue: .main
        ) { [weak self] _ in self?.emitState() })
    }

    private func observeItem(_ item: AVPlayerItem) {
        itemStatusObservation = item.observe(\.status, options: [.new]) { [weak self] observed, _ in
            guard let self else { return }
            if observed.status == .failed {
                self.lastErrorCode = "MEDIA_IOS_PLAYER"
            } else if observed.status == .readyToPlay && self.wantsPlayback && self.player.rate == 0 {
                self.player.play()
            }
            self.emitState()
        }
    }

    private func observeAudioSession() {
        observers.append(NotificationCenter.default.addObserver(
            forName: AVAudioSession.interruptionNotification,
            object: AVAudioSession.sharedInstance(),
            queue: .main
        ) { [weak self] notification in self?.handleInterruption(notification) })
        observers.append(NotificationCenter.default.addObserver(
            forName: AVAudioSession.routeChangeNotification,
            object: AVAudioSession.sharedInstance(),
            queue: .main
        ) { [weak self] _ in self?.emitState(extra: ["routeChanged": true]) })
    }

    private func handleInterruption(_ notification: Notification) {
        guard let rawType = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: rawType) else { return }
        if type == .began {
            emitState(extra: ["interruption": "active"])
            return
        }
        let rawOptions = notification.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt ?? 0
        let mayResume = AVAudioSession.InterruptionOptions(rawValue: rawOptions).contains(.shouldResume)
        if mayResume && wantsPlayback {
            do {
                try AVAudioSession.sharedInstance().setActive(true)
                startPlayback()
            } catch {
                lastErrorCode = "MEDIA_AUDIO_SESSION"
            }
        }
        emitState(extra: ["interruption": "ended", "mayResume": mayResume])
    }

    private func configureRemoteCommands() {
        let commands = MPRemoteCommandCenter.shared()
        let playTarget = commands.playCommand.addTarget { [weak self] _ in
            self?.startPlayback()
            return .success
        }
        remoteCommandTargets.append((commands.playCommand, playTarget))
        let pauseTarget = commands.pauseCommand.addTarget { [weak self] _ in
            self?.wantsPlayback = false
            self?.player.pause()
            return .success
        }
        remoteCommandTargets.append((commands.pauseCommand, pauseTarget))
        let seekTarget = commands.changePlaybackPositionCommand.addTarget { [weak self] event in
            guard let self, let position = event as? MPChangePlaybackPositionCommandEvent else { return .commandFailed }
            player.seek(to: CMTime(seconds: position.positionTime, preferredTimescale: 1000))
            return .success
        }
        remoteCommandTargets.append((commands.changePlaybackPositionCommand, seekTarget))
    }

    private func startPlayback() {
        hasStarted = true
        wantsPlayback = true
        let duration = finiteSeconds(player.currentItem?.duration ?? .zero)
        if duration > 0 && finiteSeconds(player.currentTime()) >= duration {
            player.seek(to: .zero, toleranceBefore: .zero, toleranceAfter: .zero) { [weak self] _ in
                guard let self, self.wantsPlayback else { return }
                self.player.play()
            }
        } else {
            player.play()
        }
    }

    private func updateNowPlaying(title: String, artist: String) {
        MPNowPlayingInfoCenter.default().nowPlayingInfo = [
            MPMediaItemPropertyTitle: title,
            MPMediaItemPropertyArtist: artist
        ]
    }

    private func emitState(extra: JSObject = [:]) {
        var state = snapshot()
        extra.forEach { state[$0.key] = $0.value }
        notifyListeners("stateChange", data: state)
        updateNowPlayingProgress()
    }

    private func snapshot() -> JSObject {
        let position = finiteSeconds(player.currentTime())
        let duration = finiteSeconds(player.currentItem?.duration ?? .zero)
        let buffered = finiteSeconds(player.currentItem?.loadedTimeRanges.last?.timeRangeValue.end ?? .zero)
        var state: JSObject = [
            "version": 1,
            "status": status(),
            "positionMs": position * 1000,
            "durationMs": duration * 1000,
            "bufferedMs": buffered * 1000
        ]
        if let lastErrorCode {
            state["errorCode"] = lastErrorCode
            state["errorMessage"] = "Native iOS player error"
        }
        return state
    }

    private func status() -> String {
        guard let item = player.currentItem else { return "idle" }
        if lastErrorCode != nil || item.status == .failed { return "error" }
        if item.status == .unknown { return "loading" }
        if player.timeControlStatus == .waitingToPlayAtSpecifiedRate { return "buffering" }
        if player.timeControlStatus == .playing { return "playing" }
        if finiteSeconds(item.duration) > 0 && finiteSeconds(player.currentTime()) >= finiteSeconds(item.duration) { return "ended" }
        return hasStarted ? "paused" : "ready"
    }

    private func finiteSeconds(_ time: CMTime) -> Double {
        let seconds = CMTimeGetSeconds(time)
        return seconds.isFinite && seconds > 0 ? seconds : 0
    }

    private func updateNowPlayingProgress() {
        guard var info = MPNowPlayingInfoCenter.default().nowPlayingInfo else { return }
        info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = finiteSeconds(player.currentTime())
        info[MPMediaItemPropertyPlaybackDuration] = finiteSeconds(player.currentItem?.duration ?? .zero)
        info[MPNowPlayingInfoPropertyPlaybackRate] = player.rate
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }
}

#if DEBUG
private final class LuastraPhysicalMediaProbe {
    static let shared = LuastraPhysicalMediaProbe()

    private var player: AVPlayer?
    private var timer: Timer?
    private var observers: [NSObjectProtocol] = []
    private var remoteCommandTargets: [(MPRemoteCommand, Any)] = []
    private var startedAt = Date()
    private var phase = ""
    private var loopCount = 0
    private var events: [[String: Any]] = []
    private var wantsPlayback = false

    func start(phase: String) {
        guard player == nil, let source = packagedWav() else {
            writeResult(error: "PACKAGED_WAV_NOT_FOUND")
            return
        }
        self.phase = phase
        startedAt = Date()
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.playback, mode: .default, options: [])
        } catch let error as NSError {
            writeResult(error: "MEDIA_AUDIO_CATEGORY:\(error.domain):\(error.code)")
            return
        }
        do {
            try session.setActive(true)
        } catch let error as NSError {
            writeResult(error: "MEDIA_AUDIO_ACTIVE:\(error.domain):\(error.code)")
            return
        }

        let player = AVPlayer(url: source)
        player.actionAtItemEnd = .none
        self.player = player
        configureRemoteCommands()
        observeLifecycleAndAudio()
        MPNowPlayingInfoCenter.default().nowPlayingInfo = [
            MPMediaItemPropertyTitle: "Luastra physical media probe",
            MPMediaItemPropertyArtist: "Luastra"
        ]
        events.append(event("probe-start"))
        wantsPlayback = true
        player.play()
        if phase.contains("route-change") {
            scheduleBuiltInRouteProbe()
        }
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            self?.writeResult()
        }
        writeResult()
    }

    private func scheduleBuiltInRouteProbe() {
        let session = AVAudioSession.sharedInstance()
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) { [weak self] in
            guard let self else { return }
            do {
                try session.setCategory(.playAndRecord, mode: .default, options: [])
                try session.setActive(true)
                try session.overrideOutputAudioPort(.none)
                self.record("route-selected-receiver")
            } catch {
                self.writeResult(error: "MEDIA_ROUTE_RECEIVER")
            }
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 5) { [weak self] in
            guard let self else { return }
            do {
                try session.overrideOutputAudioPort(.speaker)
                self.record("route-selected-speaker")
            } catch {
                self.writeResult(error: "MEDIA_ROUTE_SPEAKER")
            }
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 8) { [weak self] in
            guard let self else { return }
            do {
                try session.overrideOutputAudioPort(.none)
                try session.setCategory(.playback, mode: .default, options: [])
                try session.setActive(true)
                self.player?.play()
                self.record("route-restored-playback")
            } catch {
                self.writeResult(error: "MEDIA_ROUTE_RESTORE")
            }
        }
    }

    private func packagedWav() -> URL? {
        guard let root = Bundle.main.resourceURL?.appendingPathComponent("public", isDirectory: true),
              let enumerator = FileManager.default.enumerator(at: root, includingPropertiesForKeys: nil) else { return nil }
        for case let url as URL in enumerator where url.pathExtension.lowercased() == "wav" { return url }
        return nil
    }

    private func observeLifecycleAndAudio() {
        let center = NotificationCenter.default
        let names: [(Notification.Name, String)] = [
            (UIApplication.didEnterBackgroundNotification, "background"),
            (UIApplication.willEnterForegroundNotification, "foreground"),
            (UIApplication.didBecomeActiveNotification, "active")
        ]
        for (name, label) in names {
            observers.append(center.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in
                self?.record(label)
            })
        }
        observers.append(center.addObserver(forName: .AVPlayerItemDidPlayToEndTime, object: nil, queue: .main) { [weak self] _ in
            guard let self, let player = self.player else { return }
            self.loopCount += 1
            self.events.append(self.event("loop"))
            player.seek(to: .zero, toleranceBefore: .zero, toleranceAfter: .zero) { _ in player.play() }
            self.writeResult()
        })
        observers.append(center.addObserver(forName: AVAudioSession.interruptionNotification, object: AVAudioSession.sharedInstance(), queue: .main) { [weak self] notification in
            guard let self else { return }
            let raw = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt
            if raw == AVAudioSession.InterruptionType.began.rawValue {
                self.record("interruption-began")
                return
            }
            let rawOptions = notification.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt ?? 0
            let mayResume = AVAudioSession.InterruptionOptions(rawValue: rawOptions).contains(.shouldResume)
            self.record(mayResume ? "interruption-ended-should-resume" : "interruption-ended-no-resume")
            guard mayResume, self.wantsPlayback else { return }
            do {
                try AVAudioSession.sharedInstance().setActive(true)
                self.player?.play()
                self.record("interruption-resumed")
            } catch {
                self.writeResult(error: "MEDIA_AUDIO_RESUME")
            }
        })
        observers.append(center.addObserver(forName: AVAudioSession.routeChangeNotification, object: AVAudioSession.sharedInstance(), queue: .main) { [weak self] _ in
            let outputs = AVAudioSession.sharedInstance().currentRoute.outputs.map { $0.portType.rawValue }.joined(separator: "+")
            self?.record(outputs.isEmpty ? "route-change-none" : "route-change-\(outputs)")
        })
    }

    private func configureRemoteCommands() {
        let commands = MPRemoteCommandCenter.shared()
        let play = commands.playCommand.addTarget { [weak self] _ in self?.wantsPlayback = true; self?.record("remote-play"); self?.player?.play(); return .success }
        let pause = commands.pauseCommand.addTarget { [weak self] _ in self?.wantsPlayback = false; self?.record("remote-pause"); self?.player?.pause(); return .success }
        let seek = commands.changePlaybackPositionCommand.addTarget { [weak self] value in
            guard let self, let event = value as? MPChangePlaybackPositionCommandEvent else { return .commandFailed }
            self.record("remote-seek")
            self.player?.seek(to: CMTime(seconds: event.positionTime, preferredTimescale: 1000))
            return .success
        }
        remoteCommandTargets = [(commands.playCommand, play), (commands.pauseCommand, pause), (commands.changePlaybackPositionCommand, seek)]
    }

    private func record(_ name: String) {
        events.append(event(name))
        if events.count > 64 { events.removeFirst(events.count - 64) }
        writeResult()
    }

    private func event(_ name: String) -> [String: Any] {
        ["name": name, "elapsedMs": Int(Date().timeIntervalSince(startedAt) * 1000)]
    }

    private func writeResult(error: String? = nil) {
        guard let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first else { return }
        let player = self.player
        let position = max(0, CMTimeGetSeconds(player?.currentTime() ?? .zero))
        let duration = max(0, CMTimeGetSeconds(player?.currentItem?.duration ?? .zero))
        let state: String
        switch UIApplication.shared.applicationState {
        case .active: state = "active"
        case .inactive: state = "inactive"
        case .background: state = "background"
        @unknown default: state = "unknown"
        }
        let route = AVAudioSession.sharedInstance().currentRoute.outputs.map { $0.portType.rawValue }
        var result: [String: Any] = [
            "schemaVersion": 1,
            "phase": phase,
            "elapsedMs": Int(Date().timeIntervalSince(startedAt) * 1000),
            "applicationState": state,
            "positionMs": position.isFinite ? Int(position * 1000) : 0,
            "durationMs": duration.isFinite ? Int(duration * 1000) : 0,
            "rate": player?.rate ?? 0,
            "loopCount": loopCount,
            "routeOutputs": route,
            "events": events
        ]
        if let error { result["error"] = error }
        guard JSONSerialization.isValidJSONObject(result),
              let data = try? JSONSerialization.data(withJSONObject: result, options: [.prettyPrinted, .sortedKeys]) else { return }
        try? data.write(to: documents.appendingPathComponent("luastra-physical-media-proof.v1.json"), options: .atomic)
    }
}

extension LuastraMediaPlugin {
    public static func runPhysicalMediaProbeIfRequested() {
        let prefix = "--luastra-media-proof="
        let argument = ProcessInfo.processInfo.arguments.first(where: { $0.hasPrefix(prefix) })
        guard let phase = argument.map({ String($0.dropFirst(prefix.count)) }),
              !phase.isEmpty else { return }
        DispatchQueue.main.async { LuastraPhysicalMediaProbe.shared.start(phase: phase) }
    }
}
#endif
