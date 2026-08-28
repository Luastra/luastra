import type { PluginListenerHandle } from "@capacitor/core";

export type NativeMediaOperation = "load" | "play" | "pause" | "seek" | "stop" | "unload" | "state";

export interface NativeMediaState {
  version: 1;
  status: "idle" | "loading" | "ready" | "playing" | "paused" | "buffering" | "ended" | "error";
  positionMs: number;
  durationMs: number;
  bufferedMs: number;
  errorCode?: string;
  errorMessage?: string;
}

export interface NativeMediaCommand {
  operation: NativeMediaOperation;
  source?: string;
  positionMs?: number;
  title?: string;
  artist?: string;
}

export interface LuastraMediaPlugin {
  command(command: NativeMediaCommand): Promise<NativeMediaState>;
  addListener(eventName: "stateChange", listener: (state: NativeMediaState) => void): Promise<PluginListenerHandle>;
  removeAllListeners(): Promise<void>;
}

export declare const LuastraMedia: LuastraMediaPlugin;
