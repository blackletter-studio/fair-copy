# Vendored Hunspell dictionary

These are the English `.aff` (affix rules) and `.dic` (dictionary) files that
drive Proofmark's spell-checker. They originated from the
[`dictionary-en`](https://github.com/wooorm/dictionaries) npm package
(SCOWL-derived, MIT licensed).

## Why vendored

We can't import them from `dictionary-en` directly at runtime:

1. The package's default loader calls `fs.readFile`, which doesn't exist in
   the Word task pane (a browser-ish environment with no filesystem).
2. The package's `exports` field in `package.json` gates off the `.aff` and
   `.dic` subpaths, so we can't `?raw`-import them straight from
   `node_modules/dictionary-en/` either.

Vendoring the two files sidesteps both problems and gives us a stable import
path. The total size (~555KB) is small enough that shipping them in the
task-pane bundle is fine — nspell parses them once per session and caches the
result in memory.

## Refresh procedure

When upstream publishes a new `dictionary-en` version we want to pick up:

```bash
cd fair-copy
pnpm update dictionary-en@latest
cp node_modules/dictionary-en/index.aff src/proofmark/engine/spelling/dict/en.aff
cp node_modules/dictionary-en/index.dic src/proofmark/engine/spelling/dict/en.dic
pnpm test tests/proofmark/engine/spelling
git add src/proofmark/engine/spelling/dict/ package.json pnpm-lock.yaml
git commit -m "chore(spell): refresh vendored en dictionary to vX.Y.Z"
```

The `dictionary-en` package itself is still listed as a dependency so the
version we vendored is pinned in `pnpm-lock.yaml` — this makes provenance
auditable and gives us a clean upgrade path.
