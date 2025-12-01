#!/usr/bin/env node

/**
 * Build script for Stitch LMS Web Application
 * Validates and prepares web files for deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = __dirname;
const CLIENT_DIR = path.join(ROOT_DIR, 'client');
const BUILD_DIR = path.join(ROOT_DIR, 'dist');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  ensureDir(destDir);
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

function validateWebFiles() {
  log('\n📋 Validating web files...', 'blue');
  
  const requiredFiles = [
    'client/index.html',
    'client/js/api.js',
  ];

  const missing = [];
  for (const file of requiredFiles) {
    const filePath = path.join(ROOT_DIR, file);
    if (!fs.existsSync(filePath)) {
      missing.push(file);
    }
  }

  if (missing.length > 0) {
    log(`❌ Missing required files: ${missing.join(', ')}`, 'red');
    return false;
  }

  log('✅ All required files found', 'green');
  return true;
}

function buildWeb() {
  log('\n🚀 Building Stitch LMS Web Application...', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');

  // Validate files
  if (!validateWebFiles()) {
    process.exit(1);
  }

  // Clean build directory
  if (fs.existsSync(BUILD_DIR)) {
    log('\n🧹 Cleaning build directory...', 'yellow');
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
  }

  // Create build directory
  ensureDir(BUILD_DIR);

  // Copy client files
  log('\n📦 Copying web files...', 'blue');
  copyDir(CLIENT_DIR, path.join(BUILD_DIR, 'client'));

  // Copy docs if needed
  const docsDir = path.join(ROOT_DIR, 'docs');
  if (fs.existsSync(docsDir)) {
    log('📚 Copying documentation...', 'blue');
    copyDir(docsDir, path.join(BUILD_DIR, 'docs'));
  }

  // Create build info
  const buildInfo = {
    buildTime: new Date().toISOString(),
    version: '1.0.0',
    files: {
      client: countFiles(CLIENT_DIR),
      total: countFiles(BUILD_DIR),
    },
  };

  fs.writeFileSync(
    path.join(BUILD_DIR, 'build-info.json'),
    JSON.stringify(buildInfo, null, 2)
  );

  log('\n✅ Build completed successfully!', 'green');
  log(`📁 Build output: ${BUILD_DIR}`, 'green');
  log(`📊 Files copied: ${buildInfo.files.total}`, 'green');
  log('\n💡 Next steps:', 'yellow');
  log('   - Deploy dist/ directory to your web server', 'yellow');
  log('   - Or use: docker build -t stitch-lms:latest .', 'yellow');
  log('   - Or use: npm run build:docker', 'yellow');
}

function countFiles(dir) {
  let count = 0;
  if (!fs.existsSync(dir)) return 0;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      count += countFiles(path.join(dir, entry.name));
    } else {
      count++;
    }
  }
  return count;
}

// Run build
try {
  buildWeb();
} catch (error) {
  log(`\n❌ Build failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
}

