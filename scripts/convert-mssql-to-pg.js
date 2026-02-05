#!/usr/bin/env node

/**
 * Convert all Azure Function API endpoints from mssql to PostgreSQL pg
 * Run this script to convert all API endpoints at once
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_DIR = path.join(__dirname, '..', 'api');
const apiEndpoints = [
  'GetInvoices',
  'GetLessorStats',
  'DeleteVehicle',
  'DeletePage',
  'UpdatePage',
  'AuthSession',
  'AuthLogout',
  'AuthLogin',
  'AuthMe',
  'AuthSignup',
  'CreatePage',
  'DeletePageBlock',
  'SetModule',
  'GetModules',
  'GetPages',
  'UpdatePageBlock',
  'GetPageBlocks',
  'Tenant'
];

// Template for converting mssql to pg
function convertMSSQLToPG(content) {
  let converted = content;

  // Replace require statement
  converted = converted.replace(
    "const sql = require('mssql');",
    "const pool = require('../db.js');"
  );

  // Remove mssql config block
  converted = converted.replace(
    /const config = \{[\s\S]*?\};\s*/,
    ''
  );

  // Replace sql.connect with pool
  converted = converted.replace(
    /let pool = await sql\.connect\(config\);\s*/g,
    '// Using connection pool from db.js\n'
  );

  // Replace await pool.close() 
  converted = converted.replace(
    /await pool\.close\(\);\s*/g,
    ''
  );

  // Replace mssql parameter syntax with pg syntax
  // @paramName -> $1, $2, etc
  converted = replaceMSSQLParams(converted);

  // Replace result.recordset with result.rows
  converted = converted.replace(
    /result\.recordset/g,
    'result.rows'
  );

  // Replace T-SQL functions
  converted = converted.replace(
    /GETUTCDATE\(\)/g,
    'CURRENT_TIMESTAMP'
  );

  // Replace BIT with BOOLEAN
  converted = converted.replace(
    /BIT NOT NULL DEFAULT 0/g,
    'BOOLEAN NOT NULL DEFAULT FALSE'
  );

  converted = converted.replace(
    /BIT NOT NULL DEFAULT 1/g,
    'BOOLEAN NOT NULL DEFAULT TRUE'
  );

  // Replace is_active = 1 with is_active = TRUE
  converted = converted.replace(
    /= 1\b(?![\d])/g,
    '= TRUE'
  );

  // Replace is_active = 0 with is_active = FALSE
  converted = converted.replace(
    /= 0\b(?![\d])/g,
    '= FALSE'
  );

  return converted;
}

function replaceMSSQLParams(content) {
  const paramRegex = /@(\w+)/g;
  let paramIndex = 1;
  const paramMap = {};

  return content.replace(paramRegex, (match, paramName) => {
    if (!paramMap[paramName]) {
      paramMap[paramName] = `$${paramIndex}`;
      paramIndex++;
    }
    return paramMap[paramName];
  });
}

console.log('🔄 Converting API endpoints from mssql to PostgreSQL...\n');

let converted = 0;
let skipped = 0;

apiEndpoints.forEach(endpoint => {
  const filePath = path.join(API_DIR, endpoint, 'index.js');
  
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  ${endpoint}: File not found`);
    skipped++;
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already converted
    if (content.includes("const pool = require('../db.js');")) {
      console.log(`✅ ${endpoint}: Already converted`);
      skipped++;
      return;
    }

    // Skip if not using mssql
    if (!content.includes("require('mssql')")) {
      console.log(`⏭️  ${endpoint}: Not using mssql`);
      skipped++;
      return;
    }

    const converted_content = convertMSSQLToPG(content);
    fs.writeFileSync(filePath, converted_content, 'utf8');
    console.log(`✅ ${endpoint}: Converted successfully`);
    converted++;
  } catch (error) {
    console.error(`❌ ${endpoint}: Error - ${error.message}`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`   ✅ Converted: ${converted}`);
console.log(`   ⏭️  Skipped: ${skipped}`);
console.log(`\n✨ Complete! Run 'npm install' to update dependencies.`);
