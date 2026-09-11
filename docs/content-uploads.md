# Content selection and upload

Status: included in the `0.5.0-alpha` browser contract. Luastra extends the existing
`luastra/content` and `UI.Image` contracts; it does not add picker, avatar,
profile, post, or provider-specific UI components.

## Application flow

Declare `content.pick` and `content.upload` in the project's `capabilities`
array. The declarations grant access to the host adapters; the separate
`backend.uploads` declaration below limits which server-side purposes may store
which image types and sizes.

`Content.pickImage` returns an ordinary request ID. The browser owns an
inaccessible single-file input and returns only a `preview:` handle with
host-validated metadata. Cancellation is a successful, explicit
`status = "cancelled"` result rather than an error.

```luau
local Content = require("luastra/content")

local requestId = Content.pickImage {
    maximumBytes = 5 * 1024 * 1024,
    maximumWidth = 4096,
    maximumHeight = 4096,
}

-- In application/app resolve:
local result = Content.decodePick(payload)
if result.status == "selected" then
    selectedImage = result.image
end
```

Render `selectedImage` directly with the existing component:

```luau
UI.Image {
    id = "editor/preview",
    source = selectedImage,
    label = "Selected image",
    fit = "cover",
}
```

The initial picker admits one PNG or JPEG from browser file selection. It
derives the media type and dimensions from bytes and checks browser decode
metadata. Filenames and local paths never enter Luau. SVG, HTML, archives,
executables, MIME mismatches, trailing PNG payloads, and files outside the
declared byte or dimension limits are rejected.

## Server-created intents and upload

Declare reusable upload purposes in `backend.uploads`:

```json
{
  "backend": {
    "uploads": [
      {
        "id": "profile-image",
        "provider": "local",
        "mediaTypes": ["image/png", "image/jpeg"],
        "maximumBytes": 5242880,
        "maximumWidth": 4096,
        "maximumHeight": 4096
      }
    ]
  }
}
```

An application-owned backend function creates the intent. Its handler passes
the selected metadata to the trusted content boundary:

```js
const intent = await context.content.createUploadIntent("profile-image", {
  mediaType: input.mediaType,
  bytes: input.bytes,
  width: input.width,
  height: input.height,
});
return { handle: intent.handle, expiresAt: intent.expiresAt };
```

Return only the opaque `upload:` handle to Luau, then start the host transfer:

```luau
uploadRequestId = Content.upload(selectedImage, result.handle)
```

The browser streams the original `File` with `XMLHttpRequest` to the same-origin
`/__luastra/upload/<opaque-token>` route, outside the RPC envelope. The host reads
the project-scoped opaque Luastra session bearer from host storage and adds it to
the transfer. Application Luau can store and restore this bearer through
`Host.storageSet` and `Host.storageGet`; treat it as sensitive application state.
Provider upload URLs, object paths, credentials, Supabase access tokens, and
Supabase refresh tokens remain backend-only.

Progress is a bounded `content_progress` host event. Decode its `value` with
`Content.decodeProgress`; the result contains the upload request ID, loaded
bytes, and total bytes. Non-terminal progress is coalesced to at most four
events per second. `Content.cancelUpload(uploadRequestId)` aborts an active web
transfer. Transfer retry and resumable upload are intentionally separate future
contracts. File selection has a five-minute request deadline and upload has a
fifteen-minute request deadline. These longer human/transfer deadlines do not
change the `luastra/server` RPC ceiling of thirty seconds.

After a successful transfer, an application-owned backend function commits the
intent:

```js
const image = await context.content.commitUpload(input.handle);
return image;
```

Commit independently revalidates bytes, magic type, size, and dimensions. It
returns an opaque object ID, a short-lived `content:` source, and typed image
metadata. The app stores the object ID and metadata in its own record and uses
`Content.image(...)` plus `UI.Image` for display. Later handlers can call
`context.content.openUploaded(purpose, objectId, metadata)` for a fresh display
grant or `context.content.deleteUploaded(...)` to delete the owned object.
`Content.release(previewImage)` explicitly drops a selected file; rendered blob
URLs are also revoked when their final `UI.Image` owner disappears.

## Supabase adapter

For Supabase, use a private bucket and a server-admitted prefix:

```json
{
  "id": "profile-image",
  "provider": "supabase",
  "bucket": "luastra-user-images",
  "prefix": "profile-image",
  "mediaTypes": ["image/png", "image/jpeg"],
  "maximumBytes": 5242880,
  "maximumWidth": 4096,
  "maximumHeight": 4096
}
```

The CLI-generated migration
`supabase/migrations/20260911081818_luastra_content_upload_foundation.sql`
creates the reference private bucket and owner-scoped INSERT, SELECT, and DELETE
policies. There is deliberately no UPDATE policy and Luastra never asks for
upsert. Object names are generated by the backend as
`<purpose>/<authenticated-UUID>/<opaque-object-id>.(png|jpg)`.

The adapter creates a signed upload authorization only immediately before the
same-origin stream reaches the provider. It then reads the bounded private
object back for authoritative validation before commit. The current evidence is
contract and mocked-provider evidence; a real Supabase project and its deployed
RLS policies remain a production certification gate.

## Limits and support boundary

- One selected image, PNG or JPEG, at most 25 MiB, 8192 pixels per axis, and 40
  Mi decoded pixels. A declaration can only reduce those ceilings.
- At most eight live browser selections, 64 pending server intents, and four
  concurrent transfers per runtime. Intents expire after five minutes by
  default and never after more than fifteen minutes.
- Pending and rejected local files are removed on cancellation, failure,
  expiry, reload disposal, and explicit cleanup. Remote cleanup is best effort.
- Intent state is process-local and is not suitable for multi-instance
  deployment until an external atomic intent store is added.
- Originals are not transcoded and EXIF metadata is not stripped. Applications
  must not claim metadata sanitization.
- Browser file selection is implemented. Camera, video, directory selection,
  Capacitor, Tauri, iOS, and Android selection return an explicit unsupported
  result until separately implemented and certified.
- Manual VoiceOver and NVDA certification remains deferred; automated semantics
  do not imply that certification.

The detailed security boundary and accepted risks are recorded in
[`docs/security/content-upload-threat-model.md`](./security/content-upload-threat-model.md).
