import Capacitor
import Foundation
import Security

@objc(LuastraSecureCredentialsPlugin)
public final class LuastraSecureCredentialsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LuastraSecureCredentialsPlugin"
    public let jsName = "LuastraSecureCredentials"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "remove", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise)
    ]
    private let service = "dev.luastra.alpha.credentials.v1"
    private let maximumValueBytes = 4096

    #if DEBUG
    public static func runPhysicalRestartProbeIfRequested() {
        guard let argument = ProcessInfo.processInfo.arguments.first(where: { $0.hasPrefix("--luastra-secure-restart-proof=") }) else { return }
        let phase = String(argument.dropFirst("--luastra-secure-restart-proof=".count))
        let key = "luastra.physical-restart-proof.session.token"
        let marker = Data("luastra-native-restart-proof-v1".utf8)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: "dev.luastra.alpha.credentials.v1",
            kSecAttrAccount as String: key,
            kSecUseDataProtectionKeychain as String: true
        ]
        var pass = false
        var status: OSStatus = errSecSuccess
        if phase == "write" {
            SecItemDelete(query as CFDictionary)
            var item = query
            item[kSecValueData as String] = marker
            item[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
            status = SecItemAdd(item as CFDictionary, nil)
            pass = status == errSecSuccess
        } else if phase == "read" {
            var readQuery = query
            readQuery[kSecReturnData as String] = true
            readQuery[kSecMatchLimit as String] = kSecMatchLimitOne
            var value: CFTypeRef?
            status = SecItemCopyMatching(readQuery as CFDictionary, &value)
            pass = status == errSecSuccess && (value as? Data) == marker
        } else if phase == "remove" {
            status = SecItemDelete(query as CFDictionary)
            pass = status == errSecSuccess || status == errSecItemNotFound
        } else if phase == "absent" {
            status = SecItemCopyMatching(query as CFDictionary, nil)
            pass = status == errSecItemNotFound
        }
        let result: [String: Any] = [
            "phase": phase,
            "pass": pass,
            "backend": "keychain",
            "accessibility": "after-first-unlock-this-device-only",
            "osStatus": status
        ]
        if let data = try? JSONSerialization.data(withJSONObject: result, options: [.sortedKeys]),
           let json = String(data: data, encoding: .utf8) {
            print("LUASTRA_SECURE_RESTART_PROOF \(json)")
            if let directory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
                try? data.write(to: directory.appendingPathComponent("luastra-secure-restart-proof.json"), options: .atomic)
            }
        }
    }
    #endif

    @objc public func get(_ call: CAPPluginCall) {
        guard let key = validatedKey(call) else { return }
        var query = baseQuery(key)
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        if status == errSecItemNotFound { call.resolve(["value": NSNull()]); return }
        guard status == errSecSuccess, let data = item as? Data, let value = String(data: data, encoding: .utf8) else {
            reject(call, status: status, operation: "read"); return
        }
        call.resolve(["value": value])
    }

    @objc public func set(_ call: CAPPluginCall) {
        guard let key = validatedKey(call) else { return }
        guard let value = call.getString("value") else { call.reject("credential value is required", "INVALID_ARGUMENT"); return }
        guard let data = value.data(using: .utf8), data.count <= maximumValueBytes else {
            call.reject("credential value exceeds 4096 bytes", "INVALID_ARGUMENT"); return
        }
        let query = baseQuery(key)
        let status = SecItemUpdate(query as CFDictionary, [kSecValueData as String: data] as CFDictionary)
        if status == errSecSuccess { call.resolve(); return }
        guard status == errSecItemNotFound else { reject(call, status: status, operation: "update"); return }
        var item = query
        item[kSecValueData as String] = data
        item[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        let addStatus = SecItemAdd(item as CFDictionary, nil)
        guard addStatus == errSecSuccess else { reject(call, status: addStatus, operation: "write"); return }
        call.resolve()
    }

    @objc public func remove(_ call: CAPPluginCall) {
        guard let key = validatedKey(call) else { return }
        let status = SecItemDelete(baseQuery(key) as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else { reject(call, status: status, operation: "remove"); return }
        call.resolve()
    }

    @objc public func status(_ call: CAPPluginCall) {
        call.resolve(["backend": "keychain", "accessibility": "after-first-unlock-this-device-only"])
    }

    private func validatedKey(_ call: CAPPluginCall) -> String? {
        guard let key = call.getString("key"), key.range(of: #"^luastra\.[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.session\.token$"#, options: .regularExpression) != nil else {
            call.reject("credential key is outside the bounded session-token namespace", "INVALID_ARGUMENT"); return nil
        }
        return key
    }
    private func baseQuery(_ key: String) -> [String: Any] {
        [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service,
         kSecAttrAccount as String: key, kSecUseDataProtectionKeychain as String: true]
    }
    private func reject(_ call: CAPPluginCall, status: OSStatus, operation: String) {
        call.reject("Keychain \(operation) failed (OSStatus \(status))", "SECURE_STORAGE_ERROR")
    }
}
