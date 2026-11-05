# sorodoc-cli

Command-line interface for the **SoroDoc** ecosystem. Inspects Soroban contract binaries, extracts specifications, and generates documentation, client interfaces, and API schemas.

Powered directly by [`@sorodoc/sdk`](https://www.npmjs.com/package/@sorodoc/sdk).

## Installation

### Run Directly via npx (Zero Installation)

```bash
npx sorodoc-cli --help
```

### Global Installation

```bash
npm install -g sorodoc-cli
```

### Local Project Dependency

```bash
npm install --save-dev sorodoc-cli
```

## System Requirements

- **Node.js:** `>= 20.0.0`
- **Operating Systems:** Linux, macOS, Windows (x64 / ARM64)

## Commands Overview

```text
Usage: sorodoc [options] [command]

SoroDoc CLI — Generate accurate documentation and typed interfaces from Soroban contracts

Options:
  -V, --version                output the version number
  -h, --help                   display help for command

Commands:
  generate [options] <wasm>    Generate documentation from a local Soroban WASM contract
  openapi [options] <wasm>     Generate OpenAPI 3.0 schema from a local Soroban WASM contract
  serve [options] <directory>  Serve generated documentation locally from a specified directory
  validate <wasm>              Validate contract specification for missing docs, duplicate identifiers, and schema issues
  help [command]               display help for command
```

---

## Detailed Command Usage

### 1. Generate Contract Documentation (`generate`)

Extracts the embedded `contractspecv0` custom section from a compiled Soroban WASM contract and outputs documentation in various formats:

```bash
# Generate Markdown documentation to stdout
sorodoc generate ./contracts/token.wasm

# Save Markdown documentation to a file with custom title
sorodoc generate ./contracts/token.wasm -o ./docs/token.md -t "Token Smart Contract"

# Generate typed TypeScript client bindings
sorodoc generate ./contracts/token.wasm -f typescript -o ./src/tokenClient.ts

# Generate normalized AST in JSON format
sorodoc generate ./contracts/token.wasm -f json -o ./docs/spec.json
```

**Options:**
- `-o, --output <file>`: Output file path (default: stdout).
- `-f, --format <format>`: Output format: `markdown` (default), `typescript`, or `json`.
- `-t, --title <title>`: Document title.

---

### 2. Generate OpenAPI 3.0 Specifications (`openapi`)

Generates an OpenAPI 3.0.3 schema mapping Soroban contract function invocations to endpoints:

```bash
# Print OpenAPI JSON schema to stdout
sorodoc openapi ./contracts/token.wasm

# Save OpenAPI JSON schema to a file
sorodoc openapi ./contracts/token.wasm -o ./docs/openapi.json -t "Token Contract API"
```

**Options:**
- `-o, --output <file>`: Output file path (default: stdout).
- `-t, --title <title>`: Custom API Title.

---

### 3. Validate Contract Specification (`validate`)

Performs deep structural validation on the contract's specification definitions, detecting missing function docstrings, duplicate symbols, or unsupported data types:

```bash
sorodoc validate ./contracts/token.wasm
```

**Output Example:**
```text
Contract Summary:
- Functions: 5 (5 documented)
- Structs:   2
- Enums:     1
- Unions:    0

✓ Contract specification validation passed with 0 issues.
```

---

### 4. Security-Hardened Preview Server (`serve`)

Serves generated static documentation locally with built-in path-traversal protection, recursive URL decoding protection, and safe loopback defaults:

```bash
# Serve documentation directory on default loopback http://127.0.0.1:8080
sorodoc serve ./docs

# Custom port and interface
sorodoc serve ./docs --port 3000 --host 127.0.0.1
```

**Options:**
- `-p, --port <port>`: Port to bind server to (default: `8080`).
- `-H, --host <host>`: Host interface to bind to (default: `127.0.0.1`).

---

## Architecture & SDK Integration

`sorodoc-cli` acts as a developer-facing tool that consumes `@sorodoc/sdk` as its single source of truth for:
- WebAssembly binary parsing and custom section extraction.
- XDR type normalization and AST representation.
- Deterministic Markdown, TypeScript, and OpenAPI generation.
- Contract specification validation.

No parsing logic or XDR conversion is duplicated within this repository.

---

## Testing & Quality Assurance

```bash
# Run unit and integration test suite
npm test

# Run TypeScript type check
npm run typecheck

# Build release bundle
npm run build
```

---

## License

MIT © SoroDoc Contributors
