// install-spacy.js
// Run this script to install spaCy correctly with pnpm
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("Starting spaCy installation for pnpm...");

// Check if the package is already installed
let isInstalled = false;
try {
  require.resolve("spacy-nlp");
  console.log("spaCy is already installed.");
  isInstalled = true;
} catch (e) {
  console.log("spaCy not found, will install it.");
}

if (!isInstalled) {
  try {
    // Install spacy-nlp using pnpm
    console.log("Installing spacy-nlp using pnpm...");
    execSync("pnpm install spacy-nlp@1.0.20 --save --no-optional", {
      stdio: "inherit",
    });
    console.log("spacy-nlp installed successfully.");
  } catch (error) {
    console.error("Failed to install spacy-nlp with pnpm:", error.message);
    console.log("Attempting alternative installation method...");

    try {
      // Try with --shamefully-hoist flag which can help with some packages
      execSync("pnpm install spacy-nlp@1.0.20 --save --shamefully-hoist", {
        stdio: "inherit",
      });
      console.log("spacy-nlp installed successfully with --shamefully-hoist.");
    } catch (hoistError) {
      console.error(
        "Alternative installation also failed:",
        hoistError.message
      );
      console.log(
        "Your system will use the fallback entity recognition methods."
      );
    }
  }
}

// Create a simple test to verify the installation
const testDir = path.join(__dirname, "test");
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir);
}

const testFile = path.join(testDir, "spacy-test.js");
fs.writeFileSync(
  testFile,
  `
// Try to load spacy using different methods
let spacy = null;

try {
  // Try direct require
  const spacyModule = require('spacy-nlp');
  spacy = spacyModule.default || spacyModule;
  console.log('Loaded spaCy with direct require');
} catch (e) {
  console.log('Failed to load with direct require:', e.message);
  
  try {
    // Try requiring from node_modules directly
    const spacyPath = require.resolve('spacy-nlp', { paths: [
      path.join(__dirname, '..', 'node_modules'),
      path.join(__dirname, '..', '..', 'node_modules')
    ]});
    spacy = require(spacyPath).default || require(spacyPath);
    console.log('Loaded spaCy from resolved path:', spacyPath);
  } catch (e2) {
    console.log('Failed to load from node_modules path:', e2.message);
    console.log('SpaCy is not available, fallback extraction will be used.');
    process.exit(0);
  }
}

async function testSpacy() {
  if (!spacy) {
    console.log('SpaCy module not loaded, cannot run test.');
    return;
  }
  
  try {
    console.log('Loading spaCy model...');
    await spacy.load('en_core_web_sm');
    console.log('Model loaded successfully!');
    
    console.log('Testing entity extraction...');
    const result = await spacy.parse('Apple Inc. is based in Cupertino, California. CEO Tim Cook leads the company.');
    console.log('Entities found:', result.ents);
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSpacy();
`
);

console.log(`Created test file at ${testFile}`);
console.log("You can run the test with: pnpm run test-spacy");
console.log(
  "If the test fails, your system will automatically use the fallback entity extraction."
);

console.log("Installation process completed.");
