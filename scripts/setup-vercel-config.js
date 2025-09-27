#!/usr/bin/env node

/**
 * ⚙️ Vercel Configuration Setup Script
 * 
 * Automatically creates Vercel configuration files to avoid interactive prompts
 * Ensures smooth automated deployments in CI/CD environments
 */

const fs = require('fs');
const path = require('path');
const process = require('process');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Enhanced logging
 */
function log(level, message, details = '') {
  const timestamp = new Date().toISOString();
  const levelColors = {
    INFO: colors.blue,
    SUCCESS: colors.green,
    WARNING: colors.yellow,
    ERROR: colors.red
  };
  
  const color = levelColors[level] || colors.reset;
  console.log(`${color}${level}${colors.reset} [${timestamp}] ${message} ${details}`);
}

/**
 * Validate required environment variables
 */
function validateEnvironment() {
  const required = ['VERCEL_ORG_ID', 'VERCEL_PROJECT_ID'];
  const missing = [];

  for (const envVar of required) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    log('ERROR', '❌ Missing required environment variables:', 
        `\n   ${missing.join(', ')}\n   Please set these before running the script.`);
    return false;
  }

  log('SUCCESS', '✅ All required environment variables are present');
  return true;
}

/**
 * Create Vercel project configuration
 */
function createProjectConfig() {
  const vercelDir = path.join(process.cwd(), '.vercel');
  const projectFile = path.join(vercelDir, 'project.json');

  // Ensure .vercel directory exists
  if (!fs.existsSync(vercelDir)) {
    fs.mkdirSync(vercelDir, { recursive: true });
    log('INFO', '📁 Created .vercel directory');
  }

  // Create project.json
  const projectConfig = {
    projectId: process.env.VERCEL_PROJECT_ID,
    orgId: process.env.VERCEL_ORG_ID
  };

  try {
    fs.writeFileSync(projectFile, JSON.stringify(projectConfig, null, 2));
    log('SUCCESS', '✅ Created Vercel project configuration', 
        `\n   File: ${projectFile}\n   Project ID: ${projectConfig.projectId}\n   Org ID: ${projectConfig.orgId}`);
    return true;
  } catch (error) {
    log('ERROR', '❌ Failed to create project configuration', `Error: ${error.message}`);
    return false;
  }
}

/**
 * Create or update .vercelrc file
 */
function createVercelrc() {
  const vercelrcFile = path.join(process.cwd(), '.vercelrc');
  
  const vercelrcConfig = {
    version: 2,
    scope: process.env.VERCEL_ORG_ID,
    builds: [
      {
        src: "package.json",
        use: "@vercel/next"
      }
    ]
  };

  try {
    fs.writeFileSync(vercelrcFile, JSON.stringify(vercelrcConfig, null, 2));
    log('SUCCESS', '✅ Created/updated .vercelrc configuration', 
        `\n   File: ${vercelrcFile}\n   Scope: ${vercelrcConfig.scope}`);
    return true;
  } catch (error) {
    log('ERROR', '❌ Failed to create .vercelrc configuration', `Error: ${error.message}`);
    return false;
  }
}

/**
 * Create vercel.json for deployment configuration
 */
function createVercelJson() {
  const vercelJsonFile = path.join(process.cwd(), 'vercel.json');
  
  // Only create if it doesn't exist to avoid overwriting custom configs
  if (fs.existsSync(vercelJsonFile)) {
    log('INFO', '📄 vercel.json already exists, skipping creation');
    return true;
  }

  const vercelConfig = {
    version: 2,
    buildCommand: "npm run build",
    outputDirectory: ".next",
    installCommand: "npm ci",
    framework: "nextjs",
    regions: ["iad1"], // Default to US East
    env: {
      NODE_ENV: "production"
    },
    build: {
      env: {
        NODE_ENV: "production"
      }
    },
    functions: {
      "pages/api/**/*.js": {
        runtime: "nodejs18.x"
      }
    }
  };

  try {
    fs.writeFileSync(vercelJsonFile, JSON.stringify(vercelConfig, null, 2));
    log('SUCCESS', '✅ Created vercel.json deployment configuration', 
        `\n   File: ${vercelJsonFile}\n   Framework: ${vercelConfig.framework}`);
    return true;
  } catch (error) {
    log('ERROR', '❌ Failed to create vercel.json configuration', `Error: ${error.message}`);
    return false;
  }
}

/**
 * Update .gitignore to include Vercel files
 */
function updateGitignore() {
  const gitignoreFile = path.join(process.cwd(), '.gitignore');
  const vercelEntries = [
    '# Vercel',
    '.vercel',
    '.vercel-build-output'
  ];

  try {
    let gitignoreContent = '';
    
    if (fs.existsSync(gitignoreFile)) {
      gitignoreContent = fs.readFileSync(gitignoreFile, 'utf8');
    }

    // Check if Vercel entries already exist
    const hasVercelEntries = vercelEntries.some(entry => 
      gitignoreContent.includes(entry.replace('# ', ''))
    );

    if (!hasVercelEntries) {
      // Add Vercel entries
      if (gitignoreContent && !gitignoreContent.endsWith('\n')) {
        gitignoreContent += '\n';
      }
      gitignoreContent += '\n' + vercelEntries.join('\n') + '\n';
      
      fs.writeFileSync(gitignoreFile, gitignoreContent);
      log('SUCCESS', '✅ Updated .gitignore with Vercel entries');
    } else {
      log('INFO', '📄 .gitignore already contains Vercel entries');
    }

    return true;
  } catch (error) {
    log('WARNING', '⚠️  Could not update .gitignore', `Error: ${error.message}`);
    return false; // Not critical failure
  }
}

/**
 * Verify configuration files
 */
function verifyConfiguration() {
  const requiredFiles = [
    { path: '.vercel/project.json', critical: true },
    { path: '.vercelrc', critical: false },
    { path: 'vercel.json', critical: false }
  ];

  let allGood = true;

  log('INFO', '🔍 Verifying created configuration files...');

  for (const file of requiredFiles) {
    const fullPath = path.join(process.cwd(), file.path);
    
    if (fs.existsSync(fullPath)) {
      try {
        const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        log('SUCCESS', `✅ Valid: ${file.path}`, 
            `\n   Keys: ${Object.keys(content).join(', ')}`);
      } catch (error) {
        log('WARNING', `⚠️  Invalid JSON: ${file.path}`, `Error: ${error.message}`);
        if (file.critical) allGood = false;
      }
    } else {
      log(file.critical ? 'ERROR' : 'WARNING', 
          `${file.critical ? '❌' : '⚠️'} Missing: ${file.path}`);
      if (file.critical) allGood = false;
    }
  }

  return allGood;
}

/**
 * Main setup function
 */
function setupVercelConfiguration() {
  log('INFO', '🚀 Starting Vercel configuration setup...');

  // Step 1: Validate environment
  if (!validateEnvironment()) {
    log('ERROR', '💥 Environment validation failed');
    return false;
  }

  // Step 2: Create configuration files
  const steps = [
    { name: 'Project Configuration', fn: createProjectConfig },
    { name: 'Vercelrc Configuration', fn: createVercelrc },
    { name: 'Vercel.json Configuration', fn: createVercelJson },
    { name: 'Gitignore Update', fn: updateGitignore }
  ];

  let allSuccessful = true;

  for (const step of steps) {
    log('INFO', `📝 ${step.name}...`);
    const success = step.fn();
    if (!success) {
      allSuccessful = false;
    }
  }

  // Step 3: Verify configuration
  log('INFO', '🔍 Verifying configuration...');
  const verificationSuccess = verifyConfiguration();

  if (allSuccessful && verificationSuccess) {
    log('SUCCESS', '🎉 Vercel configuration setup completed successfully!');
    log('INFO', '✅ Ready for automated deployments');
    
    // Provide next steps
    console.log(`\n${colors.cyan}📋 Next Steps:${colors.reset}`);
    console.log('   1. Commit the configuration files to your repository');
    console.log('   2. Ensure VERCEL_TOKEN is set in your CI/CD environment');
    console.log('   3. Run deployment commands (they should no longer prompt for input)');
    console.log('   4. Monitor deployment logs for any remaining issues\n');
    
    return true;
  } else {
    log('ERROR', '💥 Vercel configuration setup failed');
    log('ERROR', '❌ Some configuration files may be missing or invalid');
    
    console.log(`\n${colors.yellow}🔧 Troubleshooting:${colors.reset}`);
    console.log('   1. Check environment variables are set correctly');
    console.log('   2. Verify file system permissions');
    console.log('   3. Re-run the script with verbose output');
    console.log('   4. Manually create missing files if needed\n');
    
    return false;
  }
}

/**
 * Export configuration data for monitoring
 */
function exportConfigurationData() {
  const configData = {
    timestamp: new Date().toISOString(),
    environment: {
      VERCEL_ORG_ID: process.env.VERCEL_ORG_ID ? 'present' : 'missing',
      VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID ? 'present' : 'missing',
      VERCEL_TOKEN: process.env.VERCEL_TOKEN ? 'present' : 'missing'
    },
    files: {
      '.vercel/project.json': fs.existsSync(path.join(process.cwd(), '.vercel/project.json')),
      '.vercelrc': fs.existsSync(path.join(process.cwd(), '.vercelrc')),
      'vercel.json': fs.existsSync(path.join(process.cwd(), 'vercel.json'))
    },
    setup: {
      completed: true,
      success: verifyConfiguration()
    }
  };

  try {
    const outputFile = path.join(process.cwd(), '.vercel-setup.json');
    fs.writeFileSync(outputFile, JSON.stringify(configData, null, 2));
    log('INFO', '💾 Configuration data exported', `File: ${outputFile}`);
  } catch (error) {
    log('WARNING', '⚠️  Could not export configuration data', `Error: ${error.message}`);
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'setup';

  switch (command) {
    case 'setup':
    case 'create':
      const success = setupVercelConfiguration();
      exportConfigurationData();
      process.exit(success ? 0 : 1);
      break;

    case 'verify':
      const isValid = verifyConfiguration();
      process.exit(isValid ? 0 : 1);
      break;

    case 'help':
    default:
      console.log(`
${colors.cyan}⚙️ Vercel Configuration Setup${colors.reset}

Usage: node setup-vercel-config.js [command]

Commands:
  ${colors.green}setup${colors.reset}    Create Vercel configuration files (default)
  ${colors.green}verify${colors.reset}   Verify existing configuration files
  ${colors.green}help${colors.reset}     Show this help message

Environment Variables Required:
  VERCEL_ORG_ID      - Your Vercel organization ID
  VERCEL_PROJECT_ID  - Your Vercel project ID
  VERCEL_TOKEN       - Your Vercel authentication token

Examples:
  npm run auth:setup
  node scripts/setup-vercel-config.js setup
      `);
      break;
  }
}

// Export for use in other scripts
module.exports = {
  setupVercelConfiguration,
  validateEnvironment,
  createProjectConfig,
  verifyConfiguration
};

// Run if called directly
if (require.main === module) {
  main();
}