import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { createProgram } from "../src/index.js";

function encodeLeb128(n: number): Buffer {
  const bytes: number[] = [];
  do {
    let byte = n & 0x7f;
    n >>>= 7;
    if (n !== 0) byte |= 0x80;
    bytes.push(byte);
  } while (n !== 0);
  return Buffer.from(bytes);
}

function buildMockWasm(): Buffer {
  // A valid contractspecv0 section containing a function specification
  const specBytes = Buffer.from([0,0,0,0,0,0,0,2,102,110,0,0,0,0,0,2,102,110,0,0,0,0,0,0,0,0,0,0]);
  const nameBuf = Buffer.from("contractspecv0");
  const secNameLen = encodeLeb128(nameBuf.length);
  const secContent = Buffer.concat([secNameLen, nameBuf, specBytes]);
  const secLen = encodeLeb128(secContent.length);

  return Buffer.concat([
    Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]),
    Buffer.from([0x00]),
    secLen,
    secContent,
  ]);
}

describe("CLI Commands", () => {
  const tempWasmPath = path.join(__dirname, "test_contract.wasm");
  const tempOutPath = path.join(__dirname, "output.md");

  beforeEach(() => {
    fs.writeFileSync(tempWasmPath, buildMockWasm());
  });

  afterEach(() => {
    if (fs.existsSync(tempWasmPath)) fs.unlinkSync(tempWasmPath);
    if (fs.existsSync(tempOutPath)) fs.unlinkSync(tempOutPath);
  });

  it("fails gracefully when WASM file does not exist", async () => {
    const program = createProgram();
    program.exitOverride();

    const exitSpy = vi.spyOn(process, "exit").mockImplementation((code?: string | number | null | undefined) => {
      throw new Error(`process.exit called with ${code}`);
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      program.parseAsync(["node", "sorodoc", "generate", "non_existent.wasm"])
    ).rejects.toThrow();

    expect(errorSpy).toHaveBeenCalled();
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("generates markdown documentation output to a file", async () => {
    const program = createProgram();
    program.exitOverride();

    await program.parseAsync([
      "node",
      "sorodoc",
      "generate",
      tempWasmPath,
      "-o",
      tempOutPath,
      "-t",
      "Mock Contract",
    ]);

    expect(fs.existsSync(tempOutPath)).toBe(true);
    const content = fs.readFileSync(tempOutPath, "utf8");
    expect(content).toContain("# Mock Contract");
  });

  it("generates openapi schema to a file", async () => {
    const program = createProgram();
    program.exitOverride();

    const openapiOut = path.join(__dirname, "openapi.json");
    await program.parseAsync([
      "node",
      "sorodoc",
      "openapi",
      tempWasmPath,
      "-o",
      openapiOut,
      "-t",
      "Mock API",
    ]);

    expect(fs.existsSync(openapiOut)).toBe(true);
    const content = fs.readFileSync(openapiOut, "utf8");
    const json = JSON.parse(content);
    expect(json.openapi).toBe("3.0.3");
    expect(json.info.title).toBe("Mock API");

    fs.unlinkSync(openapiOut);
  });

  describe("Real-world compiled Soroban WASM artifacts", () => {
    const fixturesDir = path.resolve(__dirname, "../../sorodoc-sdk/fixtures");
    const incrementWasm = path.join(fixturesDir, "increment.wasm");
    const customTypesWasm = path.join(fixturesDir, "custom_types.wasm");
    const errorsWasm = path.join(fixturesDir, "errors.wasm");

    it("generates markdown, typescript, and json for real increment.wasm", async () => {
      if (!fs.existsSync(incrementWasm)) return;

      const program = createProgram();
      program.exitOverride();

      const outMd = path.join(__dirname, "increment_out.md");
      const outTs = path.join(__dirname, "increment_out.ts");
      const outJson = path.join(__dirname, "increment_out.json");

      await program.parseAsync(["node", "sorodoc", "generate", incrementWasm, "-f", "markdown", "-o", outMd]);
      await program.parseAsync(["node", "sorodoc", "generate", incrementWasm, "-f", "typescript", "-o", outTs]);
      await program.parseAsync(["node", "sorodoc", "generate", incrementWasm, "-f", "json", "-o", outJson]);

      expect(fs.readFileSync(outMd, "utf8")).toContain("increment");
      expect(fs.readFileSync(outTs, "utf8")).toContain("incrementClient");
      const jsonSpec = JSON.parse(fs.readFileSync(outJson, "utf8"));
      expect(jsonSpec.functions.length).toBeGreaterThan(0);

      fs.unlinkSync(outMd);
      fs.unlinkSync(outTs);
      fs.unlinkSync(outJson);
    });

    it("validates real custom_types.wasm and errors.wasm with CLI validate", async () => {
      if (!fs.existsSync(customTypesWasm) || !fs.existsSync(errorsWasm)) return;

      const program = createProgram();
      program.exitOverride();

      // Should run without exiting process or throwing
      await expect(
        program.parseAsync(["node", "sorodoc", "validate", customTypesWasm])
      ).resolves.not.toThrow();

      await expect(
        program.parseAsync(["node", "sorodoc", "validate", errorsWasm])
      ).resolves.not.toThrow();
    });
  });
});
