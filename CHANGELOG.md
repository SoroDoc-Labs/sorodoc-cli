# Changelog

All notable changes to `sorodoc-cli` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-02

### Added
- `sorodoc generate <wasm>`: Generates Markdown, TypeScript, or JSON AST documentation from local Soroban contracts.
- `sorodoc openapi <wasm>`: Generates OpenAPI 3.0.3 specifications from local contracts.
- `sorodoc validate <wasm>`: Audits contract specifications and reports validation metrics and warnings.
- `sorodoc serve <dir>`: Built-in security-hardened local documentation HTTP server with path-traversal prevention.
- Comprehensive CLI automated test suite covering all subcommands and real Soroban WASM artifacts.
