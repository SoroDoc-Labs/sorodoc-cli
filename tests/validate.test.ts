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

function buildValidWasm(): Buffer {
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

describe("CLI Validate Command", () => {
  const tempWasm = path.join(__dirname, "test_validate.wasm");

  beforeEach(() => {
    fs.writeFileSync(tempWasm, buildValidWasm());
  });

  afterEach(() => {
    if (fs.existsSync(tempWasm)) fs.unlinkSync(tempWasm);
  });

  it("validates a contract successfully and prints spec stats", async () => {
    const program = createProgram();
    program.exitOverride();

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await program.parseAsync(["node", "sorodoc", "validate", tempWasm]);
    expect(logSpy).toHaveBeenCalled();
    const hasContractSummary = logSpy.mock.calls.some((call) =>
      call[0] && call[0].includes("Contract Summary")
    );
    expect(hasContractSummary).toBe(true);

    logSpy.mockRestore();
  });
});
