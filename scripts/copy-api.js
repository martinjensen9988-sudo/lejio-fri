import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Copy entire /api to /dist/api
const srcDir = path.join(__dirname, '../api');
const dstDir = path.join(__dirname, '../dist/api');

// Create dist/api if not exists
if (!fs.existsSync(dstDir)) {
  fs.mkdirSync(dstDir, { recursive: true });
}

// Copy function
function copyDir(src, dst) {
  if (!fs.existsSync(dst)) {
    fs.mkdirSync(dst, { recursive: true });
  }

  const files = fs.readdirSync(src);
  files.forEach(file => {
    if (file === 'node_modules') return; // Skip node_modules here, handle separately
    
    const srcFile = path.join(src, file);
    const dstFile = path.join(dst, file);
    const stat = fs.statSync(srcFile);

    if (stat.isDirectory()) {
      copyDir(srcFile, dstFile);
    } else {
      fs.copyFileSync(srcFile, dstFile);
    }
  });
}

// Copy API structure
copyDir(srcDir, dstDir);

// Manually copy node_modules with --no-symlink approach
const nodeModulesSrc = path.join(srcDir, 'node_modules');
const nodeModulesDst = path.join(dstDir, 'node_modules');

if (fs.existsSync(nodeModulesSrc)) {
  console.log('Copying node_modules...');
  
  function copyNodeModules(src, dst) {
    if (!fs.existsSync(dst)) {
      fs.mkdirSync(dst, { recursive: true });
    }

    const files = fs.readdirSync(src);
    files.forEach(file => {
      const srcFile = path.join(src, file);
      const dstFile = path.join(dst, file);
      const stat = fs.lstatSync(srcFile);

      if (stat.isSymbolicLink()) {
        const link = fs.readlinkSync(srcFile);
        try {
          fs.symlinkSync(link, dstFile);
        } catch (e) {
          // Symlink might fail, copy instead
          copyNodeModules(srcFile, dstFile);
        }
      } else if (stat.isDirectory()) {
        copyNodeModules(srcFile, dstFile);
      } else {
        fs.copyFileSync(srcFile, dstFile);
      }
    });
  }

  if (fs.existsSync(nodeModulesDst)) {
    fs.rmSync(nodeModulesDst, { recursive: true });
  }
  copyNodeModules(nodeModulesSrc, nodeModulesDst);
}

// Copy staticwebapp.config.json for SPA routing
const configSrc = path.join(__dirname, '../staticwebapp.config.json');
const configDst = path.join(__dirname, '../dist/staticwebapp.config.json');
if (fs.existsSync(configSrc)) {
  fs.copyFileSync(configSrc, configDst);
  console.log('✓ staticwebapp.config.json copied');
}

console.log('✓ API copied to dist/api');
