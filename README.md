# sorodoc-cli

Command-line interface for the **SoroDoc** ecosystem. Inspects Soroban contract binaries, extracts specifications, and generates documentation and API schemas.

## Installation / Local Linking

In development:

```bash
cd sorodoc-sdk
npm install
npm run build

cd ../sorodoc-cli
npm install
npm run build
```

## Usage

### 1. Generate Contract Documentation

```bash
# Generate Markdown to stdout
node ./dist/index.js generate ./path/to/contract.wasm

# Generate Markdown to an output file
node ./dist/index.js generate ./path/to/contract.wasm -o ./docs/contract.md -t "Token Contract"

# Generate TypeScript Client definitions
node ./dist/index.js generate ./path/to/contract.wasm -f typescript -o ./src/contractClient.ts

# Output raw normalized AST JSON
node ./dist/index.js generate ./path/to/contract.wasm -f json
```

### 2. Generate OpenAPI 3.0 Schema

```bash
node ./dist/index.js openapi ./path/to/contract.wasm -o ./docs/openapi.json -t "Token Contract API"
```

## Testing & Quality

```bash
npm test
npm run typecheck
npm run build
```

## License

MIT
