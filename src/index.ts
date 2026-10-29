import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";
import {
  extractSpecFromWasm,
  generateMarkdown,
  generateOpenApi,
  generateTypeScript,
} from "@sorodoc/sdk";
import { startServer } from "./server.js";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("sorodoc")
    .description("SoroDoc CLI — Generate accurate documentation and typed interfaces from Soroban contracts")
    .version("0.1.0");

  program
    .command("generate <wasm>")
    .description("Generate documentation from a local Soroban WASM contract")
    .option("-o, --output <file>", "Output file path (default: stdout)")
    .option("-f, --format <format>", "Output format: markdown | typescript | json", "markdown")
    .option("-t, --title <title>", "Document title")
    .action(async (wasmPath: string, options: { output?: string; format: string; title?: string }) => {
      try {
        const resolvedPath = path.resolve(process.cwd(), wasmPath);
        if (!fs.existsSync(resolvedPath)) {
          console.error(`Error: WASM file not found at '${resolvedPath}'`);
          process.exit(1);
        }

        const wasmBuffer = fs.readFileSync(resolvedPath);
        const ast = extractSpecFromWasm(wasmBuffer);

        let outputContent = "";
        const baseName = path.basename(wasmPath, ".wasm");

        switch (options.format.toLowerCase()) {
          case "markdown":
          case "md":
            outputContent = generateMarkdown(ast, {
              contractName: baseName,
              ...(options.title ? { title: options.title } : {}),
            });
            break;

          case "typescript":
          case "ts":
            outputContent = generateTypeScript(ast, `${baseName}Client`);
            break;

          case "json":
            outputContent = JSON.stringify(ast, null, 2);
            break;

          default:
            console.error(`Error: Unsupported format '${options.format}'. Allowed: markdown, typescript, json`);
            process.exit(1);
        }

        if (options.output) {
          const outputPath = path.resolve(process.cwd(), options.output);
          fs.writeFileSync(outputPath, outputContent, "utf8");
          console.log(`Documentation successfully written to ${outputPath}`);
        } else {
          process.stdout.write(outputContent);
        }
      } catch (err) {
        console.error(`Error generating documentation: ${(err as Error).message}`);
        process.exit(1);
      }
    });

  program
    .command("openapi <wasm>")
    .description("Generate OpenAPI 3.0 schema from a local Soroban WASM contract")
    .option("-o, --output <file>", "Output file path (default: stdout)")
    .option("-t, --title <title>", "API Title")
    .action(async (wasmPath: string, options: { output?: string; title?: string }) => {
      try {
        const resolvedPath = path.resolve(process.cwd(), wasmPath);
        if (!fs.existsSync(resolvedPath)) {
          console.error(`Error: WASM file not found at '${resolvedPath}'`);
          process.exit(1);
        }

        const wasmBuffer = fs.readFileSync(resolvedPath);
        const ast = extractSpecFromWasm(wasmBuffer);
        const openapi = generateOpenApi(ast, {
          ...(options.title ? { title: options.title } : {}),
        });
        const jsonContent = JSON.stringify(openapi, null, 2);

        if (options.output) {
          const outputPath = path.resolve(process.cwd(), options.output);
          fs.writeFileSync(outputPath, jsonContent, "utf8");
          console.log(`OpenAPI schema successfully written to ${outputPath}`);
        } else {
          process.stdout.write(jsonContent);
        }
      } catch (err) {
        console.error(`Error generating OpenAPI schema: ${(err as Error).message}`);
        process.exit(1);
      }
    });

  program
    .command("serve <directory>")
    .description("Serve generated documentation locally from a specified directory")
    .option("-p, --port <port>", "Port to bind the server to (default: 8080)", "8080")
    .option("-H, --host <host>", "Host interface to bind to (default: 127.0.0.1)", "127.0.0.1")
    .action(async (directory: string, options: { port: string; host: string }) => {
      try {
        const portNumber = parseInt(options.port, 10);
        if (isNaN(portNumber) || portNumber < 0 || portNumber > 65535) {
          console.error(`Error: Invalid port number '${options.port}'`);
          process.exit(1);
        }

        const { url, close } = await startServer(directory, {
          port: portNumber,
          host: options.host,
        });

        console.log(`SoroDoc documentation server running at ${url}`);
        console.log(`Serving documentation from: ${path.resolve(process.cwd(), directory)}`);
        console.log("Press Ctrl+C to terminate.");

        process.on("SIGINT", async () => {
          console.log("\nShutting down SoroDoc server...");
          await close();
          process.exit(0);
        });
      } catch (err) {
        console.error(`Error starting documentation server: ${(err as Error).message}`);
        process.exit(1);
      }
    });

  return program;
}

export function run(): void {
  const program = createProgram();
  program.parse(process.argv);
}

if (process.env["NODE_ENV"] !== "test") {
  run();
}
