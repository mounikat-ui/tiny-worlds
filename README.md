# Tiny Worlds

A playful browser-based generative art toy. Each world is generated from a deterministic seed, can be saved locally, shared by URL, and exported as a high-resolution PNG.

## Development

```bash
bun install
bun run dev
```

## Build

```bash
bun run build
```

## Deployment

The repository is connected to Cloudflare Pages through GitHub. Pushes to `main` deploy automatically.

- Build command: `bun run build`
- Output directory: `dist`
- Production site: https://tiny-worlds.pages.dev/

## Architecture

The app keeps the artwork state as `seed + parameters`, generates deterministic shapes in the browser, and renders the same visual logic to both the preview canvas and the PNG export canvas. Saved worlds are stored locally in the browser; no account or backend is required.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
