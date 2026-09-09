# Typography

The 0.3.0-alpha source SDK introduces `UI.TextStyle` on `UI.Text`,
`UI.Button`, `UI.Link`, `UI.TextInput`, `UI.Code`, and `UI.CodeBlock`.

```luau
local UI = require("luastra/ui")
local Assets = require("luastra/assets")
return UI.Text {
    id = "heading",
    text = "Readable by design",
    textStyle = {
        font = Assets.font("font/heading"),
        fallback = "sans",
        size = 32,
        weight = 400,
        lineHeight = 1.5,
    },
}
```

Declare `font/heading` as a WOFF2 font in the project's asset manifest. The
builder copies that local asset and generates `project-typography.css`; no
remote font URL or arbitrary CSS is accepted by this API. All fields are
optional. Size is an integer from 8 to 128, expressed in sixteenths of a rem
(32 becomes 2rem). Weight is 100 through 900 in steps of 100. Line height is
1 through 3 in steps of 0.01. Fallback is `sans`, `serif`, or `mono`.

Style applies to the specified text component. This API adds no container-level
inheritance contract. Removing a field restores the component's normal CSS
behavior on the next render; omitting `textStyle` preserves existing visuals.

Luau rejects malformed fields and unsupported components. The renderer rejects
malformed transport classes and undeclared or wrong-kind font references. Font
files use the existing packaged asset ledger. The browser owns loading and
caching through CSS `@font-face` with `font-display: swap`: text uses a fallback
while loading, and remains readable if loading or decoding fails. There is no
application font-ready event or guarantee of identical fallback metrics.

One declared font maps to one normal font face. Weight may be synthesized by
the browser; variable font axes and separate italic/weight face registration are
outside this version. Missing glyphs use fallback fonts. Authors must include
the redistribution notices required by their chosen fonts.

The web renderer is shared with native WebView hosts, but browser validation
does not establish native-device typography behavior. Run the example on the
target host before claiming platform-specific fidelity.
