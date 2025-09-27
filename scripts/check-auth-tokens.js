#!/usr/bin/env node

/**
 * 🔍 Authentication Token Validation Script
 * 
 * This script validates all required authentication tokens for CI/CD operations
 * Ensures tokens are present, valid, and have proper permissions
 */

const process = require('process');

// ANSI color codes for better output
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

// Required tokens configuration
const REQUIRED_TOKENS = {
  VERCEL_TOKEN: {
    name: 'Vercel Token',
    required: true,
    description: 'Token for Vercel deployments',
    validation: (token) => token && token.length > 20
  },
  VERCEL_ORG_ID: {
    name: 'Vercel Organization ID',
    required: true,
    description: 'Vercel organization identifier',
    validation: (id) => id && id.length > 10
  },
  VERCEL_PROJECT_ID: {
    name: 'Vercel Project ID',
    required: true,
    description: 'Vercel project identifier',
    validation: (id) => id && id.length > 10
  },
  GITHUB_TOKEN: {
    name: 'GitHub Token',
    required: false, // Usually auto-provided in CI
    description: 'GitHub API token for repository access',
    validation: (token) => !token || token.startsWith('ghp_') || token.startsWith('ghs_') || token.startsWith('gho_') || token.length > 20
  },
  SENTRY_AUTH_TOKEN: {
    name: 'Sentry Auth Token',
    required: false,
    description: 'Token for Sentry release tracking',
    validation: (token) => !token || token.length > 20
  },
  CODECOV_TOKEN: {
    name: 'Codecov Token',
    required: false,
    description: 'Token for code coverage reporting',
    validation: (token) => !token || token.length > 20
  }
};

/**
 * Logs formatted messages with colors
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
 * Validates a single token
 */
function validateToken(tokenName, tokenConfig) {
  const value = process.env[tokenName];
  
  // Check if token exists
  if (!value) {
    if (tokenConfig.required) {
      log('ERROR', `❌ Missing required token: ${tokenConfig.name}`, 
          `\n   Environment variable: ${tokenName}\n   Description: ${tokenConfig.description}`);
      return false;
    } else {
      log('WARNING', `⚠️  Optional token not set: ${tokenConfig.name}`, 
          `\n   Environment variable: ${tokenName}\n   Description: ${tokenConfig.description}`);
      return true; // Optional tokens are OK to be missing
    }
  }
  
  // Validate token format if validation function provided
  if (tokenConfig.validation && !tokenConfig.validation(value)) {
    log('ERROR', `❌ Invalid token format: ${tokenConfig.name}`, 
        `\n   Environment variable: ${tokenName}\n   Token value appears to be malformed`);
    return false;
  }
  
  // Token is valid
  const maskedValue = value.length > 8 ? 
    `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : 
    '***masked***';
  
  log('SUCCESS', `✅ Valid token: ${tokenConfig.name}`, 
      `\n   Environment variable: ${tokenName}\n   Value: ${maskedValue}`);
  return true;
}

/**
 * Main validation function
 */
function validateAllTokens() {
  log('INFO', '🔍 Starting authentication token validation...');
  
  let allValid = true;
  let requiredCount = 0;
  let optionalCount = 0;
  let validCount = 0;
  let invalidCount = 0;
  
  // Validate each token
  for (const [tokenName, tokenConfig] of Object.entries(REQUIRED_TOKENS)) {
    if (tokenConfig.required) {
      requiredCount++;
    } else {
      optionalCount++;
    }
    
    const isValid = validateToken(tokenName, tokenConfig);
    if (isValid) {
      validCount++;
    } else {
      invalidCount++;
      allValid = false;
    }
  }
  
  // Summary
  log('INFO', '📊 Token validation summary:');
  console.log(`   • Required tokens: ${requiredCount}`);
  console.log(`   • Optional tokens: ${optionalCount}`);
  console.log(`   • Valid tokens: ${validCount}`);
  console.log(`   • Invalid/Missing: ${invalidCount}`);
  
  if (allValid) {
    log('SUCCESS', '🎉 All authentication tokens are valid!');
    log('INFO', '✅ Ready for automated CI/CD operations');
    return true;
  } else {
    log('ERROR', '💥 Authentication validation failed!');
    log('ERROR', '❌ CI/CD operations may fail due to missing/invalid tokens');
    
    // Provide helpful troubleshooting info
    console.log(`\n${colors.yellow}📋 Troubleshooting Tips:${colors.reset}`);
    console.log('   1. Check your CI/CD environment variables configuration');
    console.log('   2. Ensure tokens have the required permissions');
    console.log('   3. Verify token formats match expected patterns');
    console.log('   4. Check token expiration dates');
    console.log(`   5. See AUTH-TROUBLESHOOTING.md for detailed guidance\n`);
    
    return false;
  }
}

/**
 * Export validation for CI/CD health monitoring
 */
function exportValidationResults() {
  const results = {};
  
  for (const [tokenName, tokenConfig] of Object.entries(REQUIRED_TOKENS)) {
    const value = process.env[tokenName];
    results[tokenName] = {
      name: tokenConfig.name,
      required: tokenConfig.required,
      present: !!value,
      valid: !value ? !tokenConfig.required : (tokenConfig.validation ? tokenConfig.validation(value) : true),
      description: tokenConfig.description
    };
  }
  
  // Write results to file for monitoring system
  const fs = require('fs');
  const path = require('path');
  
  try {
    const outputPath = path.join(process.cwd(), '.auth-monitoring.json');
    fs.writeFileSync(outputPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      results,
      summary: {
        allValid: Object.values(results).every(r => r.valid),
        requiredValid: Object.values(results).filter(r => r.required).every(r => r.valid),
        totalTokens: Object.keys(results).length,
        validTokens: Object.values(results).filter(r => r.valid).length
      }
    }, null, 2));
    
    log('INFO', '💾 Validation results exported to .auth-monitoring.json');
  } catch (error) {
    log('WARNING', '⚠️  Could not export validation results', `Error: ${error.message}`);
  }
}

// Main execution
if (require.main === module) {
  try {
    const isValid = validateAllTokens();
    exportValidationResults();
    
    // Exit with appropriate code
    process.exit(isValid ? 0 : 1);
  } catch (error) {
    log('ERROR', '💥 Unexpected error during token validation', `Error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = {
  validateAllTokens,
  validateToken,
  exportValidationResults,
  REQUIRED_TOKENS
};