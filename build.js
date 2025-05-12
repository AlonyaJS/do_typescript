const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

// Define source and output mappings
const buildConfigs = [
  { srcDir: "src/client", outfile: "dist/client.js", platform: "browser" },
  { srcDir: "src/server", outfile: "dist/server.js", platform: "node" },
  { srcDir: "src/web", outfile: "dist/web/web.js", platform: "browser" },
];

// Check for --watch flag
const isWatchMode = process.argv.includes("--watch");

// Build each config if source directory exists and has .ts files
async function buildAll() {
  const contexts = [];
  let distDirNeeded = false;

  for (const { srcDir, outfile, platform } of buildConfigs) {
    const srcPath = path.join(__dirname, srcDir);

    // Check if source directory exists
    if (!fs.existsSync(srcPath)) {
      console.log(`Skipping ${srcDir}: directory does not exist`);
      continue;
    }

    // Get all .ts files in the source directory
    const tsFiles = fs
      .readdirSync(srcPath)
      .filter((file) => file.endsWith(".ts"))
      .map((file) => path.join(srcDir, file));

    // Skip if no .ts files are found
    if (tsFiles.length === 0) {
      console.log(`Skipping ${srcDir}: no .ts files found`);
      continue;
    }

    // Mark that dist directory is needed
    distDirNeeded = true;

    // Ensure output directory exists (e.g., dist/web for dist/web/web.js)
    const outDir = path.dirname(outfile);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // Create a temporary entry point file
    const tempEntryPoint = path.join(
      __dirname,
      srcDir,
      `_temp_entry_${path.basename(srcDir)}.ts`
    );
    const importStatements = tsFiles
      .filter((file) => !file.endsWith(path.basename(tempEntryPoint))) // Exclude the temp entry point itself
      .map((file) => {
        const moduleName = path.basename(file, ".ts");
        const relativePath = `./${moduleName}`;
        return `import * as ${moduleName} from "${relativePath}";`;
      })
      .join("\n");

    // Create a dummy reference to force inclusion of all modules
    const moduleReferences = tsFiles
      .filter((file) => !file.endsWith(path.basename(tempEntryPoint)))
      .map((file) => path.basename(file, ".ts"))
      .join(", ");
    const entryPointContent = `
${importStatements}
const __forceInclude = [${moduleReferences}];
`;

    // Write the temporary entry point file
    fs.writeFileSync(tempEntryPoint, entryPointContent);

    // Esbuild configuration
    const buildOptions = {
      entryPoints: [tempEntryPoint],
      bundle: true,
      platform,
      outfile,
      format: "cjs",
      treeShaking: false,
      minify: false,
      minifyWhitespace: true,
      minifySyntax: false,
      keepNames: true,
      sourcemap: false,
      target: "es2020",
      logLevel: "info",
      external: ["@citizenfx/client", "@citizenfx/server"],
    };

    try {
      if (isWatchMode) {
        // Create a build context for watch mode
        const context = await esbuild.context({
          ...buildOptions,
        });

        // Start watching
        await context.watch();
        console.log(`Watching ${srcDir} for changes, outputting to ${outfile}`);
        contexts.push({ context, tempEntryPoint, srcDir, outfile });
      } else {
        // Regular build
        await esbuild.build(buildOptions);
        console.log(`Built ${srcDir} to ${outfile}`);
        // Clean up temporary entry point
        if (fs.existsSync(tempEntryPoint)) {
          fs.unlinkSync(tempEntryPoint);
        }
      }
    } catch (error) {
      console.error(`Build failed for ${srcDir}:`, error);
      // Clean up temporary entry point on failure
      if (fs.existsSync(tempEntryPoint)) {
        fs.unlinkSync(tempEntryPoint);
      }
      process.exit(1);
    }
  }

  // Create dist directory only if at least one build is needed
  const distDir = path.join(__dirname, "dist");
  if (distDirNeeded && !fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Keep process alive in watch mode and handle cleanup
  if (isWatchMode) {
    process.on("SIGINT", async () => {
      console.log("Stopping watch mode...");
      for (const { context, tempEntryPoint } of contexts) {
        await context.dispose();
        if (fs.existsSync(tempEntryPoint)) {
          fs.unlinkSync(tempEntryPoint);
        }
      }
      process.exit(0);
    });
  }
}

// Run the build process
buildAll().catch((error) => {
  console.error("Build process failed:", error);
  process.exit(1);
});
