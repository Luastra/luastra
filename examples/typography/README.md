# Typography example

Run from the repository root:

```sh
node cli/luastra.mjs check --project=examples/typography
node cli/luastra.mjs test --project=examples/typography
node cli/luastra.mjs build --project=examples/typography --target=web
```

The heading can switch between a packaged font and a serif fallback, and between
32 and 48 size units. The second paragraph uses the packaged font; the third
retains default typography. The license button displays the bundled font notice.

`assets/fonts/atkinson-regular.woff2` is the Latin subset of Atkinson Hyperlegible
Regular 400, downloaded unchanged from
https://fonts.gstatic.com/s/atkinsonhyperlegible/v12/9Bt23C1KxNDXMspQ1lPyU89-1h6ONRlW45G04pIoWQeCbA.woff2 .
Its SIL Open Font License 1.1 is retained in `OFL.txt` and in the built application
through `src/font-license.luau`. The license source is
https://github.com/google/fonts/blob/main/ofl/atkinsonhyperlegible/OFL.txt .
Other scripts use browser fallback fonts; this example does not promise complete
Unicode coverage or separate font faces for every weight.
