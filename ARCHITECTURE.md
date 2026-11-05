# Architecture — sorodoc-cli

`sorodoc-cli` is the command-line developer interface for the **SoroDoc** ecosystem. It provides terminal-based contract documentation generation, schema extraction, contract validation, and local documentation previews.

---

## 1. System Role & SDK Integration

```
                         ┌─────────────────────┐
                         │   Terminal User /   │
                         │   CI/CD Pipeline    │
                         └──────────┬──────────┘
                                    │
                              (sorodoc CLI)
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │     src/index.ts    │
                         │ (Commander Program) │
                         └─────┬─────────┬─────┘
                               │         │
                 ┌─────────────┘         └─────────────┐
                 │                                     │
                 ▼                                     ▼
      ┌──────────────────────┐              ┌─────────────────────┐
      │     src/server.ts    │              │    @sorodoc/sdk     │
      │ (Local HTTP Preview) │              │  (Published Engine) │
      └──────────────────────┘              └─────────────────────┘
```

### Architectural Principles
- **Delegation to SDK:** `sorodoc-cli` contains no custom WebAssembly parsing or documentation generation logic. Every contract inspection and transformation call is delegated to `@sorodoc/sdk`:
  - `extractSpecFromWasm`
  - `generateMarkdown`
  - `generateTypeScript`
  - `generateOpenApi`
  - `validateContractSpec`
- **Zero Sibling Repository Reliance:** The CLI depends strictly on the published `@sorodoc/sdk` npm package. It does not reference `file:../sorodoc-sdk`.

---

## 2. Command Architecture

The CLI is structured into four primary commands:

```
sorodoc
├── generate <wasm>   # Extracts and formats contract specs into Markdown, TypeScript, or JSON
├── openapi <wasm>    # Extracts contract specs and produces an OpenAPI 3.0 schema
├── validate <wasm>   # Runs spec completeness and validation checks
└── serve <directory> # Starts a secure local preview HTTP server for generated documentation
```

### Command Behavior Matrix

| Command | Input | Primary SDK Function | Output Options |
| :--- | :--- | :--- | :--- |
| `generate` | `.wasm` file path | `extractSpecFromWasm`<br>`generateMarkdown`<br>`generateTypeScript` | File (`-o`) or `stdout`<br>Formats: `markdown`, `typescript`, `json` |
| `openapi` | `.wasm` file path | `extractSpecFromWasm`<br>`generateOpenApi` | File (`-o`) or `stdout`<br>Formatted OpenAPI 3.0 JSON |
| `validate` | `.wasm` file path | `extractSpecFromWasm`<br>`validateContractSpec` | Console summary with function/struct stats and issues list; exit code 0 or 1 |
| `serve` | Directory path | Local static file server | HTTP server bound to loopback (`127.0.0.1:<port>`) |

---

## 3. Server Security & Path Traversal Mitigations

The preview server implemented in `src/server.ts` includes multi-layered defensive security controls:
1. **Host Binding:** Binds strictly to `127.0.0.1` by default to prevent accidental local network exposure.
2. **Method Restriction:** Responds only to `GET` and `HEAD` HTTP requests.
3. **Null Byte Detection:** Immediately rejects requests with embedded or URL-encoded null bytes (`\0`, `%00`).
4. **Recursive URL Decoding:** Decodes URL paths iteratively (up to 3 passes) to prevent double-encoding bypasses (`%252e%252e`).
5. **Canonical Path Realpath Verification:** Resolves target paths using `fs.realpathSync` and asserts that the real filesystem target remains strictly within the canonical root directory.
6. **MIME Sniffing Prevention:** Sends `X-Content-Type-Options: nosniff` headers on all responses.

---

## 4. Build & Distribution

- **Bundler:** `tsup` bundles `src/index.ts` into `dist/index.js` targeting `node >= 20.0.0`.
- **Executable Configuration:** `package.json` configures `"bin": { "sorodoc": "dist/index.js" }` and the bundle starts with a standard Node shebang (`#!/usr/bin/env node`).
- **Files Allowed:** Only `dist`, `README.md`, and `LICENSE` are included in the published npm package.
