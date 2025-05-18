#!/usr/bin/env node
// start-spacy-server.js
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// Configuration
const PYTHON_COMMAND = process.platform === "win32" ? "python" : "python3";
const SPACY_SERVER_SCRIPT = path.join(__dirname, "spacy_server.py");
const PORT = process.env.SPACY_SERVER_PORT || 5001;

// Check if Python is installed
function checkPythonInstallation() {
  console.log("Checking Python installation...");

  try {
    const result = require("child_process").execSync(
      `${PYTHON_COMMAND} --version`
    );
    console.log(`Python detected: ${result.toString().trim()}`);
    return true;
  } catch (error) {
    console.error("Error: Python is not installed or not in the PATH");
    console.error(
      "Please install Python 3.8+ from https://www.python.org/downloads/"
    );
    return false;
  }
}

// Check if spaCy and the English model are installed
function checkSpacyInstallation() {
  console.log("Checking spaCy installation...");

  try {
    require("child_process").execSync(
      `${PYTHON_COMMAND} -c "import spacy; spacy.load('en_core_web_sm')"`
    );
    console.log("spaCy and English model are installed");
    return true;
  } catch (error) {
    console.error("Error: spaCy or the English model is not installed");
    console.error("Please install spaCy and download the English model:");
    console.error("  pip install spacy");
    console.error("  python -m spacy download en_core_web_sm");
    return false;
  }
}

// Check if the server script exists
function checkServerScript() {
  if (!fs.existsSync(SPACY_SERVER_SCRIPT)) {
    console.error(`Error: Server script not found at ${SPACY_SERVER_SCRIPT}`);
    console.error("Please create the script first");
    return false;
  }
  return true;
}

// Start the spaCy server
function startServer() {
  console.log(`Starting spaCy server on port ${PORT}...`);

  const server = spawn(PYTHON_COMMAND, [SPACY_SERVER_SCRIPT, "--port", PORT]);

  server.stdout.on("data", (data) => {
    console.log(`[spaCy Server] ${data.toString().trim()}`);
  });

  server.stderr.on("data", (data) => {
    console.error(`[spaCy Server ERROR] ${data.toString().trim()}`);
  });

  server.on("close", (code) => {
    console.log(`spaCy server exited with code ${code}`);
  });

  // Handle process termination
  process.on("SIGINT", () => {
    console.log("Stopping spaCy server...");
    server.kill();
    process.exit();
  });

  process.on("SIGTERM", () => {
    console.log("Stopping spaCy server...");
    server.kill();
    process.exit();
  });
}

// Main function
function main() {
  if (!checkPythonInstallation()) return;
  if (!checkSpacyInstallation()) return;
  if (!checkServerScript()) return;

  startServer();
}

// Run the main function
main();
