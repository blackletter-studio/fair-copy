# Fair Copy

Microsoft Word add-in that strips formatting noise from a DOCX while preserving bold / italic / underline emphasis and paragraph alignment. Includes Proofmark, a typo-highlighter with an amber visual treatment that does not collide with Word's tracked-changes markup.

Part of [Black Letter Studio](https://blackletter.studio).

## Status

M0 scaffold. No product logic yet; task pane renders a placeholder. Real formatting-strip engine ships in M2; Proofmark in M3.

## Development

```
pnpm install
pnpm start:word   # sideload into local Word
```

Requires Microsoft Word (desktop, 2019+ or Word for Mac 16.50+).

## License

Proprietary. See LICENSE.md (added during M4).
