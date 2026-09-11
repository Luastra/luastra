# Dynamic images

Status: included in the `0.5.0-alpha` public-source contract. `UI.Image` is the only public image
component for packaged assets, protected object reads, and host-local previews.
There is no remote-image, avatar, post-card, feed-image, or provider-specific UI
component.

## One typed image contract

Packaged images remain compatible and can now stay typed through the final UI
boundary:

```luau
local Assets = require("luastra/assets")
local UI = require("luastra/ui")

return UI.Image {
    id = "article/cover",
    source = Assets.image("image/cover"),
    label = "Mountain ridge at sunrise",
    fit = "cover",
}
```

`Assets.uri(Assets.image(...))` remains supported. Dynamic images use the small
`luastra/content` module:

```luau
local Assets = require("luastra/assets")
local Content = require("luastra/content")
local UI = require("luastra/ui")

local cover = Content.image(result.source, {
    mediaType = result.mediaType,
    bytes = result.bytes,
    width = result.width,
    height = result.height,
    orientation = result.orientation,
    placeholderColor = "#DDE5E2",
})

return UI.Image {
    id = "article/cover",
    source = cover,
    placeholder = Assets.image("image/cover-placeholder"),
    label = "Mountain ridge at sunrise",
    fit = "cover",
    onLoad = "cover.loaded",
    onError = "cover.failed",
}
```

`Content.image` accepts only an opaque `content:` or `preview:` handle plus
bounded image metadata. It rejects unsupported media types, byte sizes above
25 MiB, dimensions above 8192 pixels on either axis, decoded areas above 40 Mi
pixels, unknown metadata fields, and malformed placeholder colors. Application
Luau cannot pass an arbitrary HTTPS URL, provider-signed URL, filesystem path,
`data:` URL, `blob:` URL, raw byte array, or bucket path.

`label` remains required. Use an empty label only when the image is genuinely
decorative. `onLoad` and `onError` are ordinary bounded application actions.
An error action is the refresh boundary for an expired, revoked, offline, or
undecodable dynamic source: request a new delivery from the backend and render
the returned handle. Do not persist private handles in an ordinary state
snapshot or write them to logs.

## Protected Supabase object reads

The provider choice belongs to trusted project configuration:

```json
{
  "backend": {
    "authentication": "session",
    "identity": { "provider": "supabase" },
    "content": [
      {
        "id": "image/article-cover",
        "provider": "supabase",
        "bucket": "private-media",
        "path": "covers/article-cover.png",
        "mediaType": "image/png",
        "bytes": 48123,
        "width": 1280,
        "height": 720
      }
    ]
  }
}
```

The bucket must be private and protected by Storage RLS policies. Luastra uses
the authenticated provider session stored behind its encrypted broker to ask
Supabase for a delivery lasting at most 60 seconds. The provider-signed URL and
provider access token stay in backend memory. The handler receives a Luastra
grant and returns only its public fields:

```js
const grant = await context.content.issue("image/article-cover", {
  ttlMs: 60_000,
});

return {
  source: grant.source,
  expiresAt: grant.expiresAt,
  mediaType: grant.metadata.mediaType,
  bytes: grant.metadata.bytes,
  width: grant.metadata.width,
  height: grant.metadata.height,
  orientation: grant.metadata.orientation,
};
```

The web host resolves `content:` to a same-origin
`/__luastra/content/<opaque-token>` request. The trusted runner proxies only the
admitted media type and byte budget, disables ordinary caching, refuses
redirects, and never exposes the upstream signed URL to Luau or the DOM. Missing,
expired, or revoked grants return no object-path detail. Network failure and an
invalid upstream response also remain bounded host failures.

The manifest contains no Supabase URL, publishable key, session-encryption key,
access token, refresh token, or signed URL. The existing
`LUASTRA_SUPABASE_URL`, `LUASTRA_SUPABASE_PUBLISHABLE_KEY`, and
`LUASTRA_SESSION_ENCRYPTION_KEY_B64URL` backend environment boundary is reused.

## Host-local preview lifecycle

A host registers a `preview:` handle through `Content.pickImage`. The same
`Content.image` and `UI.Image` code then renders it. The host retains a
resolved preview resource only while at least one rendered image owns it and
releases the resource after the last owner changes source or is removed.

Applications must not construct `blob:` or file URLs themselves. Selection,
upload, cancellation, commit, and deletion are documented in
[`content-uploads.md`](./content-uploads.md).

## Current evidence boundary

Automated contracts cover packaged backward compatibility, direct typed Luau
usage, protected and preview handle admission, provider URL isolation, short
expiry, offline delivery failure, browser decode-error actions, declared versus
decoded dimension mismatch, placeholder rendering, and last-owner preview
release. Local and Supabase object reads use the same `content:` result shape.

Slice 5 adds the web PNG/JPEG picker and upload path without changing the image
component. Camera, video, persistent private-image caching, Tauri,
Android, and iOS selection remain outside current certification. Manual
VoiceOver and NVDA certification is explicitly deferred and must not be
inferred from automated semantic checks.
