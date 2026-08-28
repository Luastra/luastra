package dev.luastra.media;

import android.content.ComponentName;
import android.net.Uri;
import android.util.Log;
import androidx.core.content.ContextCompat;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MediaMetadata;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.session.MediaController;
import androidx.media3.session.SessionToken;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.common.util.concurrent.ListenableFuture;
import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "LuastraMedia")
public final class LuastraMediaPlugin extends Plugin implements Player.Listener {
    private static final String TAG = "LuastraMedia";
    private static final long TIME_UNSET = -9223372036854775807L;
    private final List<PluginCall> waiting = new ArrayList<>();
    private ListenableFuture<MediaController> controllerFuture;
    private MediaController controller;

    @Override
    public void load() {
        SessionToken token = new SessionToken(getContext(), new ComponentName(getContext(), LuastraMediaService.class));
        controllerFuture = new MediaController.Builder(getContext(), token).buildAsync();
        controllerFuture.addListener(() -> {
            try {
                controller = controllerFuture.get();
                controller.addListener(this);
                for (PluginCall call : waiting) execute(call);
            } catch (Exception error) {
                for (PluginCall call : waiting) call.reject("Unable to connect to Luastra media service", "MEDIA_SERVICE", error);
            } finally {
                waiting.clear();
            }
        }, ContextCompat.getMainExecutor(getContext()));
    }

    @PluginMethod
    public void command(PluginCall call) {
        ContextCompat.getMainExecutor(getContext()).execute(() -> {
            if (controller == null) {
                waiting.add(call);
                return;
            }
            execute(call);
        });
    }

    private void execute(PluginCall call) {
        String operation = call.getString("operation", "");
        try {
            switch (operation) {
                case "load" -> loadItem(call);
                case "play" -> {
                    if (controller.getPlaybackState() == Player.STATE_ENDED) controller.seekTo(0);
                    controller.play();
                }
                case "pause" -> controller.pause();
                case "seek" -> controller.seekTo(Math.max(0, call.getLong("positionMs", 0L)));
                case "stop" -> controller.stop();
                case "unload" -> { controller.stop(); controller.clearMediaItems(); }
                case "state" -> { }
                default -> { call.reject("Unsupported media operation", "MEDIA_OPERATION"); return; }
            }
            JSObject state = snapshot();
            call.resolve(state);
            notifyListeners("stateChange", state);
        } catch (Exception error) {
            Log.e(TAG, "Native media command failed: " + operation, error);
            call.reject("Native media command failed", "MEDIA_COMMAND", error);
        }
    }

    private void loadItem(PluginCall call) {
        String source = call.getString("source", "");
        Uri uri = Uri.parse(source);
        String scheme = uri.getScheme();
        if (("https".equals(scheme) || "capacitor".equals(scheme)) && "localhost".equalsIgnoreCase(uri.getHost())) {
            String path = uri.getPath();
            if (path == null || !path.startsWith("/assets/") || path.contains("..")) {
                throw new IllegalArgumentException("Invalid packaged media path");
            }
            uri = Uri.parse("asset:///public" + path);
            scheme = "asset";
        }
        if (!("https".equals(scheme) || "file".equals(scheme) || "content".equals(scheme) || "asset".equals(scheme))) {
            throw new IllegalArgumentException("Media source must be secure remote or admitted local content");
        }
        MediaMetadata metadata = new MediaMetadata.Builder()
            .setTitle(call.getString("title", ""))
            .setArtist(call.getString("artist", ""))
            .build();
        MediaItem item = new MediaItem.Builder().setUri(uri).setMediaMetadata(metadata).build();
        controller.setMediaItem(item);
        controller.prepare();
    }

    private JSObject snapshot() {
        JSObject state = new JSObject();
        state.put("version", 1);
        state.put("status", status());
        state.put("positionMs", Math.max(0, controller.getCurrentPosition()));
        state.put("durationMs", boundedTime(controller.getDuration()));
        state.put("bufferedMs", Math.max(0, controller.getBufferedPosition()));
        PlaybackException error = controller.getPlayerError();
        if (error != null) {
            state.put("errorCode", "MEDIA_ANDROID_" + error.errorCode);
            state.put("errorMessage", "Native Android player error");
        }
        return state;
    }

    private long boundedTime(long value) {
        return value == TIME_UNSET ? 0 : Math.max(0, value);
    }

    private String status() {
        if (controller.getPlayerError() != null) return "error";
        if (controller.getMediaItemCount() == 0) return "idle";
        if (controller.isPlaying()) return "playing";
        return switch (controller.getPlaybackState()) {
            case Player.STATE_BUFFERING -> "buffering";
            case Player.STATE_READY -> controller.getPlayWhenReady() ? "playing" : "ready";
            case Player.STATE_ENDED -> "ended";
            default -> "loading";
        };
    }

    private void emitState() {
        if (controller != null) notifyListeners("stateChange", snapshot());
    }

    @Override public void onPlaybackStateChanged(int playbackState) { emitState(); }
    @Override public void onIsPlayingChanged(boolean isPlaying) { emitState(); }
    @Override public void onPlayerError(PlaybackException error) { Log.e(TAG, "Native player failed", error); emitState(); }
    @Override public void onMediaItemTransition(MediaItem mediaItem, int reason) { emitState(); }
    @Override public void onPositionDiscontinuity(Player.PositionInfo oldPosition, Player.PositionInfo newPosition, int reason) { emitState(); }

    @Override
    protected void handleOnDestroy() {
        ContextCompat.getMainExecutor(getContext()).execute(() -> {
            if (controller != null) controller.removeListener(this);
            if (controllerFuture != null) MediaController.releaseFuture(controllerFuture);
            for (PluginCall call : waiting) call.reject("Media plugin destroyed", "MEDIA_DISPOSED");
            waiting.clear();
            controller = null;
        });
    }
}
