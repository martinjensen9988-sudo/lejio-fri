// Persistent storage for PageBuilder using JSON files
// In production, replace with real database (Supabase/Azure SQL)

const fs = require("fs");
const path = require("path");

const STORAGE_DIR = path.join(__dirname, "..", "..", "data");

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

const PAGES_FILE = path.join(STORAGE_DIR, "pages.json");
const BLOCKS_FILE = path.join(STORAGE_DIR, "blocks.json");

// Initialize files if they don't exist
if (!fs.existsSync(PAGES_FILE)) {
  fs.writeFileSync(PAGES_FILE, JSON.stringify({}));
}
if (!fs.existsSync(BLOCKS_FILE)) {
  fs.writeFileSync(BLOCKS_FILE, JSON.stringify({}));
}

function readPages() {
  try {
    return JSON.parse(fs.readFileSync(PAGES_FILE, "utf8")) || {};
  } catch {
    return {};
  }
}

function writePages(data) {
  fs.writeFileSync(PAGES_FILE, JSON.stringify(data, null, 2));
}

function readBlocks() {
  try {
    return JSON.parse(fs.readFileSync(BLOCKS_FILE, "utf8")) || {};
  } catch {
    return {};
  }
}

function writeBlocks(data) {
  fs.writeFileSync(BLOCKS_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
  readPages,
  writePages,
  readBlocks,
  writeBlocks,
};
