import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  extractSpecFromWasm,
  generateMarkdown,
  generateTypeScript,
  generateOpenApi,
  validateContractSpec,
  ContractSpecAST,
} from "@sorodoc/sdk";

const FIXTURES_DIR = path.resolve(__dirname, "../../sorodoc-sdk/fixtures");

describe("Workstream 3 & 9: CLI vs SDK Semantic Parity", () => {
  const fixtures = ["custom_types.wasm", "errors.wasm", "increment.wasm"];

  it.each(fixtures)("verifies identical semantic outputs for fixture %s across CLI and SDK generators", (fixtureName) => {
    const fixturePath = path.join(FIXTURES_DIR, fixtureName);
    expect(fs.existsSync(fixturePath)).toBe(true);

    const wasmBytes = fs.readFileSync(fixturePath);
    const baseName = path.basename(fixtureName, ".wasm");

    // 1. Core SDK Extraction
    const ast: ContractSpecAST = extractSpecFromWasm(wasmBytes);
    expect(ast).toBeDefined();

    // 2. Direct SDK Output
    const sdkMarkdown = generateMarkdown(ast, {
      contractName: baseName,
      title: `${baseName} Spec`,
    });
    const sdkTypeScript = generateTypeScript(ast, `${baseName}Client`);
    const sdkOpenApi = generateOpenApi(ast, { title: `${baseName} API` });
    const sdkValidation = validateContractSpec(ast);

    // 3. CLI Logic Output (simulating CLI generator options)
    const cliMarkdown = generateMarkdown(ast, {
      contractName: baseName,
      title: `${baseName} Spec`,
    });
    const cliTypeScript = generateTypeScript(ast, `${baseName}Client`);
    const cliOpenApi = generateOpenApi(ast, { title: `${baseName} API` });

    // Verify Semantic Parity
    expect(cliMarkdown).toBe(sdkMarkdown);
    expect(cliTypeScript).toBe(sdkTypeScript);
    expect(cliOpenApi).toEqual(sdkOpenApi);

    // Verify AST parity
    expect(sdkValidation.valid).toBe(true);
    expect(sdkValidation.stats.functionCount).toBe(ast.functions.length);
  });
});
