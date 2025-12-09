#!/usr/bin/env node

/**
 * Health Vault AI - Deployment Helper Script
 * This script helps prepare and deploy the application to Vercel
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description} exists`, 'green');
    return true;
  } else {
    log(`❌ ${description} missing: ${filePath}`, 'red');
    return false;
  }
}

function main() {
  log('🚀 Health Vault AI - Deployment Preparation', 'blue');
  log('=' * 50, 'blue');

  // Check required files
  const requiredFiles = [
    ['package.json', 'Package configuration'],
    ['vercel.json', 'Vercel configuration'],
    ['api/index.js', 'API entry point'],
    ['backend/server.js', 'Backend server'],
    ['src/main.jsx', 'Frontend entry point'],
    ['.env.example', 'Environment template']
  ];

  let allFilesExist = true;
  requiredFiles.forEach(([file, desc]) => {
    if (!checkFile(file, desc)) {
      allFilesExist = false;
    }
  });

  if (!allFilesExist) {
    log('\n❌ Some required files are missing. Please check the above errors.', 'red');
    process.exit(1);
  }

  // Check environment variables
  log('\n📋 Environment Variables Check:', 'yellow');
  if (fs.existsSync('.env')) {
    log('✅ .env file exists (for local development)', 'green');
    log('⚠️  Remember to set these in Vercel dashboard:', 'yellow');
    
    const envContent = fs.readFileSync('.env', 'utf8');
    const envVars = envContent.split('\n')
      .filter(line => line.includes('=') && !line.startsWith('#'))
      .map(line => line.split('=')[0]);
    
    envVars.forEach(varName => {
      if (varName.trim()) {
        log(`   - ${varName}`, 'blue');
      }
    });
  } else {
    log('⚠️  No .env file found. Use .env.example as reference.', 'yellow');
  }

  // Build check
  log('\n🔨 Building project...', 'yellow');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    log('✅ Build successful', 'green');
  } catch (error) {
    log('❌ Build failed. Please fix build errors before deploying.', 'red');
    process.exit(1);
  }

  // Final instructions
  log('\n🎉 Deployment Preparation Complete!', 'green');
  log('\nNext steps:', 'blue');
  log('1. Push your code to GitHub', 'blue');
  log('2. Connect your GitHub repo to Vercel', 'blue');
  log('3. Add environment variables in Vercel dashboard', 'blue');
  log('4. Deploy!', 'blue');
  log('\nOr use Vercel CLI:', 'blue');
  log('  npm install -g vercel', 'blue');
  log('  vercel --prod', 'blue');
  
  log('\n📖 See DEPLOYMENT_GUIDE.md for detailed instructions', 'yellow');
}

main();