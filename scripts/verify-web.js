const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const requiredFiles = [
  "package.json",
  "app.json",
  "public/_redirects",
  "public/manifest.json",
  "public/index.html",
  "public/sw.js",
];

const requiredDependencies = [
  "expo",
  "react",
  "react-dom",
  "react-native",
  "react-native-web",
  "@expo/metro-runtime",
];

let failed = false;

function readJson(relativePath) {
  const fullPath = path.join(root, relativePath);

  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch (error) {
    console.error(`❌ Invalid JSON: ${relativePath}`);
    console.error(error.message);
    failed = true;
    return null;
  }
}

console.log("BioStack PRO — Web/PWA verification");
console.log("--------------------------------------");

for (const relativePath of requiredFiles) {
  const fullPath = path.join(root, relativePath);

  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${relativePath}`);
  } else {
    console.error(`❌ Missing: ${relativePath}`);
    failed = true;
  }
}

const packageJson = readJson("package.json");

if (packageJson) {
  const dependencies = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
  };

  for (const dependency of requiredDependencies) {
    if (dependencies[dependency]) {
      console.log(`✅ dependency: ${dependency}`);
    } else {
      console.error(`❌ missing dependency: ${dependency}`);
      failed = true;
    }
  }

  if (packageJson.scripts?.["build:web"]) {
    console.log("✅ script: build:web");
  } else {
    console.error("❌ missing script: build:web");
    failed = true;
  }

  if (packageJson.scripts?.["verify:web"]) {
    console.log("✅ script: verify:web");
  } else {
    console.error("❌ missing script: verify:web");
    failed = true;
  }
}

const appJson = readJson("app.json");

if (appJson?.expo) {
  const web = appJson.expo.web;

  if (web?.bundler === "metro") {
    console.log("✅ web bundler: metro");
  } else {
    console.error("❌ web bundler is not configured as metro");
    failed = true;
  }

  if (web?.output === "single") {
    console.log("✅ web output: single");
  } else {
    console.error("❌ web output is not configured as single");
    failed = true;
  }

  if (web?.favicon) {
    console.log(`✅ web favicon: ${web.favicon}`);
  } else {
    console.error("❌ web favicon is not configured");
    failed = true;
  }
}

console.log("--------------------------------------");

if (failed) {
  console.error("❌ Web/PWA verification failed.");
  process.exit(1);
}

console.log("✅ Web/PWA verification passed.");
