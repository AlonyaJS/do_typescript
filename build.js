const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const IS_WATCH_MODE = process.argv.includes("--watch");

// Recursively check for .ts files
const hasTypeScriptFiles = (dir) => {
  if (!fs.existsSync(dir)) return false;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.some((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return hasTypeScriptFiles(fullPath);
    return entry.name.endsWith(".ts");
  });
};

// Recursively copy .html and .css files
const copyStaticFiles = (srcDir, destDir) => {
  if (!fs.existsSync(srcDir)) return;

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyStaticFiles(srcPath, destPath);
    } else if (entry.name.endsWith(".html") || entry.name.endsWith(".css")) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied static file: ${srcPath} -> ${destPath}`);
    }
  }
};

const buildFolder = (folder, outDir, platform) => {
  const dir = path.join(__dirname, folder);

  if (!fs.existsSync(dir)) {
    console.log(`Skipped: ${folder} does not exist.`);
    return;
  }

  const tsExists = hasTypeScriptFiles(dir);
  const watchFlag = IS_WATCH_MODE ? "--watch" : "";

  if (tsExists) {
    console.log(`Building ${folder}...`);
    exec(
      `npx esbuild ${folder}/**/*.ts --bundle --minify-syntax --minify-whitespace --keep-names --platform=${platform} --outdir=dist/${outDir} ${watchFlag}`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(
            `Error executing esbuild for ${folder}: ${error.message}`
          );
          process.exit(1);
        }
        if (stderr) console.log(stderr);
        if (stdout) console.log(stdout);
      }
    );
  } else {
    console.log(`No TypeScript files in ${folder} to build.`);
  }

  // Special case: copy .html/.css if it's the web folder
  if (folder === "src/web") {
    copyStaticFiles(dir, path.join(__dirname, "dist/web"));
  }
};

// Build folders
buildFolder("src/server", "server", "node");
buildFolder("src/client", "client", "browser");
buildFolder("src/web", "web", "browser");
