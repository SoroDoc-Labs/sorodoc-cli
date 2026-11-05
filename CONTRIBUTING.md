# Contributing to sorodoc-cli

Thank you for your interest in contributing to **SoroDoc CLI**! We welcome bug fixes, usability improvements, documentation updates, and new CLI capabilities.

`sorodoc-cli` provides the terminal interface for the [SoroDoc Ecosystem](https://github.com/SoroDoc-Labs). It enables developers and CI/CD pipelines to validate Soroban contracts, generate Markdown, TypeScript clients, and OpenAPI schemas, and serve local preview documentation.

---

## Prerequisites

- **Node.js**: `>= 20.0.0` (Active LTS versions 20.x, 22.x, or 24.x)
- **npm**: `>= 10.0.0`
- **Git**: `>= 2.30.0`

Verify your setup:
```bash
node -v
npm -v
git --version
```

---

## Quickstart Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SoroDoc-Labs/sorodoc-cli.git
   cd sorodoc-cli
   ```

2. **Install dependencies:**
   ```bash
   npm ci
   ```

3. **Build the CLI executable:**
   ```bash
   npm run build
   ```

4. **Run the test suite:**
   ```bash
   npm test
   ```

5. **Test the CLI locally:**
   ```bash
   node dist/index.js --help
   # or link globally during development:
   npm link
   sorodoc --version
   ```

---

## Available Development Scripts

All scripts are configured in `package.json`:

| Command | Description |
| :--- | :--- |
| `npm run build` | Bundles TypeScript into the standalone executable binary `dist/index.js` using `tsup`. |
| `npm run typecheck` | Validates static types with `tsc --noEmit`. |
| `npm test` | Executes the complete unit and integration test suite via Vitest. |
| `npm run test:watch` | Runs Vitest in watch mode for test-driven development. |

---

## Architectural Boundaries & Responsibility

`sorodoc-cli` is a terminal wrapper and developer workflow interface.

### Key Architectural Guidelines
1. **Never Duplicate SDK Logic:** Parsing WASM sections, deserializing XDR, constructing ASTs, and formatting Markdown/TypeScript/OpenAPI belong strictly in `@sorodoc/sdk`. The CLI consumes `@sorodoc/sdk` as a published npm dependency.
2. **Path & Output Safety:** When writing generated files, the CLI must safely validate paths and recursively create target output directories (`fs.mkdirSync(outputDir, { recursive: true })`).
3. **Local Server Security:** The embedded `serve` command preview server is hardened to strictly prevent directory traversal, verify path boundaries with `fs.realpathSync`, reject null bytes, and bind to loopback (`127.0.0.1`) by default.
4. **Independently Usable:** The CLI must never require cloning sibling repositories. A user anywhere in the world should be able to run `npx sorodoc-cli` against any `.wasm` contract file.

For detailed architecture explanations, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Git Workflow & Contribution Process

1. **Find or Open an Issue:**
   Browse [CLI open issues](https://github.com/SoroDoc-Labs/sorodoc-cli/issues). Look for issues labeled [`good first issue`](https://github.com/SoroDoc-Labs/sorodoc-cli/labels/good%20first%20issue) or [`beginner`](https://github.com/SoroDoc-Labs/sorodoc-cli/labels/beginner).

2. **Create a Feature Branch:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feat/your-feature-name
   # or: git checkout -b fix/your-bugfix-name
   ```

3. **Commit Messages:**
   Use Conventional Commits:
   ```text
   feat(cli): add dry-run preview flag
   fix(server): sanitize directory listing output
   docs(readme): add example for typescript generation
   ```

4. **Local Verification Checklist:**
   Before opening a PR, ensure all gates pass:
   ```bash
   npm run typecheck
   npm run build
   npm test
   ```

5. **Submit a Pull Request:**
   - Push your branch: `git push origin feat/your-feature-name`.
   - Open a PR against `main`. Fill in the PR description completely.
   - GitHub Actions CI will run your tests across Node.js 20.x, 22.x, and 24.x.

---

## Reporting Issues & Security

- **Bug Reports & Features:** Submit using our GitHub issue templates.
- **Security Vulnerabilities:** Follow the private reporting process outlined in [SECURITY.md](./SECURITY.md). Never submit public issues for security exploits.

---

## Code of Conduct

Please adhere to our [Code of Conduct](./CODE_OF_CONDUCT.md) during all interactions.
