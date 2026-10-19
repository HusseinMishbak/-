import Foundation
import Combine
import Security

struct NativeLearningSnapshot: Codable {
    var version: Int = 1
    var updatedAt: Date = .now
    var vocabulary: [VocabularyCard]
    var sessions: [StudyRecord]
    var quizAttempts: [QuizRecord]
}

struct NativeAuthSession: Codable {
    let userID: String
    let email: String
    let accessToken: String
    let refreshToken: String
    let expiresAt: Date
}

private struct SupabaseAuthUser: Decodable {
    let id: String?
    let email: String?
}

private struct SupabaseAuthResponse: Decodable {
    let access_token: String?
    let refresh_token: String?
    let expires_in: Int?
    let user: SupabaseAuthUser?
}

private enum NativeSessionVault {
    private static let service = "com.husseinmishbak.orrfrench.auth"
    private static let account = "supabase-session"

    static func load() -> NativeAuthSession? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var result: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data else { return nil }
        return try? JSONDecoder().decode(NativeAuthSession.self, from: data)
    }

    static func save(_ session: NativeAuthSession) {
        guard let data = try? JSONEncoder().encode(session) else { return }
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        let attributes: [String: Any] = [
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        ]
        if SecItemUpdate(query as CFDictionary, attributes as CFDictionary) == errSecItemNotFound {
            var insert = query
            attributes.forEach { insert[$0.key] = $0.value }
            SecItemAdd(insert as CFDictionary, nil)
        }
    }

    static func clear() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        SecItemDelete(query as CFDictionary)
    }
}

@MainActor
final class NativeAuthStore: ObservableObject {
    @Published private(set) var session: NativeAuthSession?
    @Published private(set) var isBusy = false
    @Published private(set) var statusMessage = ""

    private let baseURL = URL(string: "https://yycilzamasypqpvevrup.supabase.co")!
    // Supabase publishable key only. Never embed a service-role or secret key in an app.
    private let publishableKey = "sb_publishable_LhVBnws-UM44UZfpqSh_RA_Sm1qaBWx"
    private var lastRemoteExperience: [String: Any] = [:]

    init() {
        session = NativeSessionVault.load()
    }

    func signIn(email: String, password: String) async -> Bool {
        isBusy = true
        defer { isBusy = false }
        do {
            let body = try JSONSerialization.data(withJSONObject: ["email": email.trimmingCharacters(in: .whitespacesAndNewlines), "password": password])
            let data = try await request(path: "auth/v1/token?grant_type=password", method: "POST", body: body)
            let response = try JSONDecoder().decode(SupabaseAuthResponse.self, from: data)
            guard let access = response.access_token, let refresh = response.refresh_token,
                  let id = response.user?.id else {
                statusMessage = "لم يكتمل تسجيل الدخول. تأكد من تأكيد البريد الإلكتروني."
                return false
            }
            let value = NativeAuthSession(userID: id, email: response.user?.email ?? email,
                                          accessToken: access, refreshToken: refresh,
                                          expiresAt: Date().addingTimeInterval(TimeInterval(response.expires_in ?? 3600)))
            session = value
            NativeSessionVault.save(value)
            statusMessage = "تم تسجيل الدخول. جارٍ تحميل التقدّم."
            return true
        } catch {
            statusMessage = error.localizedDescription
            return false
        }
    }

    func signUp(email: String, password: String, fullName: String) async -> Bool {
        isBusy = true
        defer { isBusy = false }
        do {
            let body = try JSONSerialization.data(withJSONObject: [
                "email": email.trimmingCharacters(in: .whitespacesAndNewlines),
                "password": password,
                "data": ["full_name": fullName.trimmingCharacters(in: .whitespacesAndNewlines)]
            ])
            let data = try await request(path: "auth/v1/signup", method: "POST", body: body)
            let response = try JSONDecoder().decode(SupabaseAuthResponse.self, from: data)
            if let access = response.access_token, let refresh = response.refresh_token, let id = response.user?.id {
                let value = NativeAuthSession(userID: id, email: response.user?.email ?? email,
                                              accessToken: access, refreshToken: refresh,
                                              expiresAt: Date().addingTimeInterval(TimeInterval(response.expires_in ?? 3600)))
                session = value
                NativeSessionVault.save(value)
                statusMessage = "تم إنشاء الحساب."
                return true
            }
            statusMessage = "تم إرسال طلب التسجيل. تحقق من بريدك لتأكيد الحساب، ثم سجّل الدخول."
            return false
        } catch {
            statusMessage = error.localizedDescription
            return false
        }
    }

    func signOut() async {
        isBusy = true
        defer { isBusy = false }
        if let value = try? await validSession() {
            _ = try? await request(path: "auth/v1/logout", method: "POST", body: nil, bearer: value.accessToken)
        }
        session = nil
        lastRemoteExperience = [:]
        NativeSessionVault.clear()
        statusMessage = "تم تسجيل الخروج. بقيت نسختك المحلية محفوظة على هذا الجهاز."
    }

    func fetchLearningSnapshot() async throws -> NativeLearningSnapshot? {
        let value = try await validSession()
        var components = URLComponents(url: baseURL.appendingPathComponent("rest/v1/student_progress"), resolvingAgainstBaseURL: false)!
        components.queryItems = [
            URLQueryItem(name: "select", value: "learning_experience"),
            URLQueryItem(name: "user_id", value: "eq.\(value.userID)")
        ]
        var request = URLRequest(url: components.url!)
        request.httpMethod = "GET"
        setHeaders(on: &request, bearer: value.accessToken)
        let data = try await perform(request)
        let rows = (try JSONSerialization.jsonObject(with: data)) as? [[String: Any]] ?? []
        guard let root = rows.first?["learning_experience"] as? [String: Any] else {
            lastRemoteExperience = [:]
            return nil
        }
        lastRemoteExperience = root
        guard let native = root["nativeApp"] as? [String: Any] else { return nil }
        let nativeData = try JSONSerialization.data(withJSONObject: native)
        return try JSONDecoder().decode(NativeLearningSnapshot.self, from: nativeData)
    }

    func saveLearningSnapshot(_ snapshot: NativeLearningSnapshot) async throws {
        let value = try await validSession()
        var root = lastRemoteExperience
        let nativeData = try JSONEncoder().encode(snapshot)
        let nativeObject = (try JSONSerialization.jsonObject(with: nativeData)) as? [String: Any] ?? [:]
        root["nativeApp"] = nativeObject
        root["nativeAppUpdatedAt"] = ISO8601DateFormatter().string(from: .now)

        let bodyObject: [String: Any] = ["user_id": value.userID, "learning_experience": root]
        let body = try JSONSerialization.data(withJSONObject: bodyObject)
        var components = URLComponents(url: baseURL.appendingPathComponent("rest/v1/student_progress"), resolvingAgainstBaseURL: false)!
        components.queryItems = [URLQueryItem(name: "on_conflict", value: "user_id")]
        var request = URLRequest(url: components.url!)
        request.httpMethod = "POST"
        request.httpBody = body
        setHeaders(on: &request, bearer: value.accessToken)
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("resolution=merge-duplicates,return=minimal", forHTTPHeaderField: "Prefer")
        _ = try await perform(request)
        lastRemoteExperience = root
    }

    func setStatus(_ message: String) {
        statusMessage = message
    }

    private func validSession() async throws -> NativeAuthSession {
        guard let current = session else {
            throw NSError(domain: "OrrAuth", code: 401, userInfo: [NSLocalizedDescriptionKey: "سجّل الدخول أولاً لمزامنة تقدّمك."])
        }
        guard current.expiresAt.timeIntervalSinceNow < 90 else { return current }
        let body = try JSONSerialization.data(withJSONObject: ["refresh_token": current.refreshToken])
        let data = try await request(path: "auth/v1/token?grant_type=refresh_token", method: "POST", body: body)
        let response = try JSONDecoder().decode(SupabaseAuthResponse.self, from: data)
        guard let access = response.access_token, let refresh = response.refresh_token else {
            NativeSessionVault.clear()
            session = nil
            throw NSError(domain: "OrrAuth", code: 401, userInfo: [NSLocalizedDescriptionKey: "انتهت الجلسة. سجّل الدخول مرة أخرى."])
        }
        let fresh = NativeAuthSession(userID: response.user?.id ?? current.userID,
                                      email: response.user?.email ?? current.email,
                                      accessToken: access, refreshToken: refresh,
                                      expiresAt: Date().addingTimeInterval(TimeInterval(response.expires_in ?? 3600)))
        session = fresh
        NativeSessionVault.save(fresh)
        return fresh
    }

    private func request(path: String, method: String, body: Data?, bearer: String? = nil) async throws -> Data {
        let pathParts = path.split(separator: "?", maxSplits: 1, omittingEmptySubsequences: false)
        var url = baseURL.appendingPathComponent(String(pathParts[0]))
        if pathParts.count > 1, var components = URLComponents(url: url, resolvingAgainstBaseURL: false) {
            components.percentEncodedQuery = String(pathParts[1])
            url = components.url ?? url
        }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.httpBody = body
        setHeaders(on: &request, bearer: bearer)
        if body != nil { request.setValue("application/json", forHTTPHeaderField: "Content-Type") }
        return try await perform(request)
    }

    private func setHeaders(on request: inout URLRequest, bearer: String?) {
        request.setValue(publishableKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let bearer { request.setValue("Bearer \(bearer)", forHTTPHeaderField: "Authorization") }
    }

    private func perform(_ request: URLRequest) async throws -> Data {
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw NSError(domain: "OrrNetwork", code: -1, userInfo: [NSLocalizedDescriptionKey: "تعذّر الاتصال بخدمة الحساب."])
        }
        guard (200..<300).contains(http.statusCode) else {
            let payload = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] ?? [:]
            let message = (payload["msg"] as? String) ?? (payload["message"] as? String) ??
                (payload["error_description"] as? String) ?? (payload["error"] as? String) ??
                "طلب غير ناجح (\(http.statusCode))."
            throw NSError(domain: "OrrNetwork", code: http.statusCode, userInfo: [NSLocalizedDescriptionKey: message])
        }
        return data
    }
}
