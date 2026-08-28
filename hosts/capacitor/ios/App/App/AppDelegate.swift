import UIKit
import Capacitor
import LuastraMediaPlugin
import LuastraSecureCredentialsPlugin

@objc(LuastraBridgeViewController)
class LuastraBridgeViewController: CAPBridgeViewController {
    private let startupOverlay = UIView()
    private let startupStatus = UILabel()
    private var readinessTimer: Timer?
    private var readinessChecks = 0

    override func viewDidLoad() {
        super.viewDidLoad()
        installStartupOverlay()
        // Capacitor can invoke capacitorDidLoad() from inside super.viewDidLoad(),
        // before the subclass has installed its overlay. Restarting here binds
        // the readiness poll to the now-visible startup boundary.
        beginReadinessChecks()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        if startupOverlay.superview != nil {
            view.bringSubviewToFront(startupOverlay)
        }
    }

    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        beginReadinessChecks()
    }

    private func installStartupOverlay() {
        startupOverlay.translatesAutoresizingMaskIntoConstraints = false
        startupOverlay.backgroundColor = UIColor { traits in
            traits.userInterfaceStyle == .dark
                ? UIColor(red: 22 / 255, green: 52 / 255, blue: 46 / 255, alpha: 1)
                : UIColor(red: 244 / 255, green: 239 / 255, blue: 227 / 255, alpha: 1)
        }
        startupOverlay.isAccessibilityElement = true
        startupOverlay.accessibilityLabel = NSLocalizedString("Luastra Alpha. Starting.", comment: "Accessible startup state")
        startupOverlay.accessibilityTraits = .staticText
        startupOverlay.accessibilityViewIsModal = true

        let mark = UILabel()
        mark.translatesAutoresizingMaskIntoConstraints = false
        mark.text = "L"
        mark.textAlignment = .center
        mark.font = .systemFont(ofSize: 34, weight: .semibold)
        mark.textColor = UIColor(red: 244 / 255, green: 239 / 255, blue: 227 / 255, alpha: 1)
        mark.backgroundColor = UIColor(red: 47 / 255, green: 117 / 255, blue: 104 / 255, alpha: 1)
        mark.layer.cornerRadius = 18
        mark.layer.masksToBounds = true
        mark.setContentHuggingPriority(.required, for: .horizontal)
        NSLayoutConstraint.activate([
            mark.widthAnchor.constraint(equalToConstant: 72),
            mark.heightAnchor.constraint(equalToConstant: 72),
        ])

        let title = UILabel()
        title.text = "Luastra"
        title.font = .preferredFont(forTextStyle: .largeTitle)
        title.adjustsFontForContentSizeCategory = true
        title.textAlignment = .center
        title.textColor = UIColor { traits in
            traits.userInterfaceStyle == .dark
                ? UIColor(red: 244 / 255, green: 239 / 255, blue: 227 / 255, alpha: 1)
                : UIColor(red: 22 / 255, green: 52 / 255, blue: 46 / 255, alpha: 1)
        }

        startupStatus.text = NSLocalizedString("Starting…", comment: "Startup status")
        startupStatus.font = .preferredFont(forTextStyle: .body)
        startupStatus.adjustsFontForContentSizeCategory = true
        startupStatus.textAlignment = .center
        startupStatus.textColor = .secondaryLabel

        let stack = UIStackView(arrangedSubviews: [mark, title, startupStatus])
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .vertical
        stack.alignment = .center
        stack.spacing = 14

        view.addSubview(startupOverlay)
        startupOverlay.addSubview(stack)
        NSLayoutConstraint.activate([
            startupOverlay.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            startupOverlay.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            startupOverlay.topAnchor.constraint(equalTo: view.topAnchor),
            startupOverlay.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            stack.centerXAnchor.constraint(equalTo: startupOverlay.safeAreaLayoutGuide.centerXAnchor),
            stack.centerYAnchor.constraint(equalTo: startupOverlay.safeAreaLayoutGuide.centerYAnchor),
            stack.leadingAnchor.constraint(greaterThanOrEqualTo: startupOverlay.safeAreaLayoutGuide.leadingAnchor, constant: 24),
            stack.trailingAnchor.constraint(lessThanOrEqualTo: startupOverlay.safeAreaLayoutGuide.trailingAnchor, constant: -24),
        ])
        webView?.accessibilityElementsHidden = true
    }

    private func beginReadinessChecks() {
        readinessTimer?.invalidate()
        readinessChecks = 0
        let timer = Timer(timeInterval: 0.1, repeats: true) { [weak self] _ in
            self?.checkWebApplicationReadiness()
        }
        readinessTimer = timer
        RunLoop.main.add(timer, forMode: .common)
        checkWebApplicationReadiness()
    }

    private func checkWebApplicationReadiness() {
        guard startupOverlay.superview != nil, let webView else {
            readinessTimer?.invalidate()
            readinessTimer = nil
            return
        }
        readinessChecks += 1
        if readinessChecks == 150 {
            startupStatus.text = NSLocalizedString("Still starting…", comment: "Extended startup status")
            startupOverlay.accessibilityLabel = NSLocalizedString("Luastra Alpha. Still starting.", comment: "Accessible extended startup state")
        }
        let script = "globalThis.__luastraPreview?.result ?? 'STARTING'"
        webView.evaluateJavaScript(script) { [weak self] value, _ in
            guard let self, let result = value as? String else { return }
            if result == "PASS" {
                self.finishStartup()
            } else if result == "FAIL" {
                self.showStartupFailure()
            }
        }
    }

    private func finishStartup() {
        readinessTimer?.invalidate()
        readinessTimer = nil
        webView?.accessibilityElementsHidden = false
        let completion: (Bool) -> Void = { [weak self] _ in
            guard let self else { return }
            self.startupOverlay.removeFromSuperview()
            self.webView?.evaluateJavaScript("globalThis.__luastraHostDidBecomeVisible?.()")
            UIAccessibility.post(notification: .screenChanged, argument: self.webView)
        }
        if UIAccessibility.isReduceMotionEnabled {
            completion(true)
        } else {
            UIView.transition(with: startupOverlay, duration: 0.2, options: [.transitionCrossDissolve, .allowAnimatedContent]) {
                self.startupOverlay.alpha = 0
            } completion: { finished in
                completion(finished)
            }
        }
    }

    private func showStartupFailure() {
        readinessTimer?.invalidate()
        readinessTimer = nil
        startupStatus.text = NSLocalizedString("Unable to start", comment: "Startup failure status")
        startupStatus.textColor = .systemRed
        startupOverlay.accessibilityLabel = NSLocalizedString("Luastra Alpha. Unable to start.", comment: "Accessible startup failure")
        UIAccessibility.post(notification: .announcement, argument: startupOverlay.accessibilityLabel)
    }

    deinit {
        readinessTimer?.invalidate()
    }
}

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
#if DEBUG
        LuastraSecureCredentialsPlugin.runPhysicalRestartProbeIfRequested()
        LuastraMediaPlugin.runPhysicalMediaProbeIfRequested()
#endif
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
