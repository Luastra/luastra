package dev.luastra.securecredentials;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.util.regex.Pattern;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import org.json.JSONObject;

@CapacitorPlugin(name = "LuastraSecureCredentials")
public final class LuastraSecureCredentialsPlugin extends Plugin {
    private static final String KEY_ALIAS = "dev.luastra.alpha.credentials.v1";
    private static final String PREFERENCES = "luastra_secure_credentials_v1";
    private static final Pattern KEY_PATTERN = Pattern.compile("^luastra\\.[A-Za-z0-9][A-Za-z0-9._-]{0,127}\\.session\\.token$");
    private static final int MAX_VALUE_BYTES = 4096;

    @PluginMethod public void get(PluginCall call) {
        String key = validatedKey(call); if (key == null) return;
        try {
            String encoded = preferences().getString(storageKey(key), null);
            JSObject result = new JSObject();
            if (encoded == null) result.put("value", JSONObject.NULL);
            else {
                byte[] envelope = Base64.decode(encoded, Base64.NO_WRAP);
                if (envelope.length < 13) throw new IllegalStateException("invalid encrypted credential envelope");
                byte[] iv = new byte[12], ciphertext = new byte[envelope.length - 12];
                System.arraycopy(envelope, 0, iv, 0, 12); System.arraycopy(envelope, 12, ciphertext, 0, ciphertext.length);
                Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
                cipher.init(Cipher.DECRYPT_MODE, getOrCreateKey(), new GCMParameterSpec(128, iv));
                cipher.updateAAD(key.getBytes(StandardCharsets.UTF_8));
                result.put("value", new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8));
            }
            call.resolve(result);
        } catch (Exception error) { call.reject("Android Keystore read failed", "SECURE_STORAGE_ERROR", error); }
    }

    @PluginMethod public void set(PluginCall call) {
        String key = validatedKey(call), value = call.getString("value"); if (key == null) return;
        if (value == null) { call.reject("credential value is required", "INVALID_ARGUMENT"); return; }
        byte[] plaintext = value.getBytes(StandardCharsets.UTF_8);
        if (plaintext.length > MAX_VALUE_BYTES) { call.reject("credential value exceeds 4096 bytes", "INVALID_ARGUMENT"); return; }
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding"); cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey());
            cipher.updateAAD(key.getBytes(StandardCharsets.UTF_8)); byte[] ciphertext = cipher.doFinal(plaintext), iv = cipher.getIV();
            byte[] envelope = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, envelope, 0, iv.length); System.arraycopy(ciphertext, 0, envelope, iv.length, ciphertext.length);
            if (!preferences().edit().putString(storageKey(key), Base64.encodeToString(envelope, Base64.NO_WRAP)).commit())
                throw new IllegalStateException("credential commit failed");
            call.resolve();
        } catch (Exception error) { call.reject("Android Keystore write failed", "SECURE_STORAGE_ERROR", error); }
    }

    @PluginMethod public void remove(PluginCall call) {
        String key = validatedKey(call); if (key == null) return;
        try {
            if (!preferences().edit().remove(storageKey(key)).commit()) throw new IllegalStateException("credential remove failed");
            call.resolve();
        } catch (Exception error) { call.reject("Android Keystore remove failed", "SECURE_STORAGE_ERROR", error); }
    }

    @PluginMethod public void status(PluginCall call) {
        JSObject result = new JSObject(); result.put("backend", "android-keystore");
        result.put("accessibility", "device-unlocked-aes-256-gcm"); call.resolve(result);
    }
    private SharedPreferences preferences() { return getContext().getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE); }
    private String validatedKey(PluginCall call) {
        String key = call.getString("key");
        if (key == null || !KEY_PATTERN.matcher(key).matches()) { call.reject("credential key is outside the bounded session-token namespace", "INVALID_ARGUMENT"); return null; }
        return key;
    }
    private String storageKey(String key) throws Exception {
        return Base64.encodeToString(MessageDigest.getInstance("SHA-256").digest(key.getBytes(StandardCharsets.UTF_8)), Base64.NO_WRAP | Base64.URL_SAFE);
    }
    private SecretKey getOrCreateKey() throws Exception {
        KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore"); keyStore.load(null);
        if (keyStore.containsAlias(KEY_ALIAS)) return (SecretKey) keyStore.getKey(KEY_ALIAS, null);
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256).setRandomizedEncryptionRequired(true).build());
        return generator.generateKey();
    }
}
