import XCTest

final class AppUITests: XCTestCase {
    @MainActor
    func testAccessibilityFixtureReflowsAcrossIPadOrientations() throws {
        let app = XCUIApplication()
        app.launch()

        let webView = app.webViews.firstMatch
        XCTAssertTrue(
            webView.waitForExistence(timeout: 20),
            "The Luastra WKWebView did not become accessible"
        )

        try assertOrientation(
            app,
            expected: .portrait,
            screenshotName: "luastra-ipad-portrait"
        )

        XCUIDevice.shared.orientation = .landscapeRight
        try assertOrientation(
            app,
            expected: .landscapeRight,
            screenshotName: "luastra-ipad-landscape"
        )

        XCTAssertTrue(
            webView.exists,
            "The Luastra WKWebView disappeared after the landscape reflow"
        )

        XCUIDevice.shared.orientation = .portrait
        try assertOrientation(
            app,
            expected: .portrait,
            screenshotName: "luastra-ipad-portrait-restored"
        )
    }

    @MainActor
    private func assertOrientation(
        _ app: XCUIApplication,
        expected: UIDeviceOrientation,
        screenshotName: String
    ) throws {
        let expectsLandscape = expected.isLandscape
        let predicate = NSPredicate { _, _ in
            let frame = app.frame
            return expectsLandscape
                ? frame.width > frame.height
                : frame.height > frame.width
        }
        let expectation = XCTNSPredicateExpectation(predicate: predicate, object: nil)
        let result = XCTWaiter.wait(for: [expectation], timeout: 8)
        XCTAssertEqual(
            result,
            .completed,
            "The app did not reach the expected \(expected) geometry"
        )

        let appFrame = app.frame
        let webView = app.webViews.firstMatch
        XCTAssertTrue(
            webView.exists,
            "The Luastra WKWebView disappeared in \(expected)"
        )
        let webViewFrame = webView.frame
        XCTAssertEqual(
            webViewFrame.width > webViewFrame.height,
            expectsLandscape,
            "The Luastra WKWebView did not follow the app orientation"
        )

        let geometry = XCTAttachment(
            string: """
            expectedOrientation=\(expected)
            deviceOrientation=\(XCUIDevice.shared.orientation)
            appFrame=\(appFrame)
            webViewFrame=\(webViewFrame)
            """
        )
        geometry.name = "\(screenshotName)-geometry"
        geometry.lifetime = .keepAlways
        add(geometry)

        // App-scoped screenshots from an iOS 18 iPad Simulator can retain the
        // portrait backing dimensions after rotation. A screen capture keeps
        // the evidence readable while the app-frame predicate above remains
        // the authoritative geometry assertion.
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = screenshotName
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
