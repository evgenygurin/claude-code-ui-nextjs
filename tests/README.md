# Test Suite Documentation

Comprehensive test suite for the Claude Code UI monitoring and automation systems.

## 📂 Test Structure

```text
tests/
├── integration/                     # Integration tests
│   ├── sentry-monitoring.test.js   # Sentry monitoring system tests
│   ├── merge-conflict-system.test.js # Merge conflict resolution tests
│   └── circleci-pipeline.test.js   # CI/CD pipeline tests
├── e2e/                            # End-to-end tests
│   └── full-workflow.test.js       # Complete workflow tests
└── README.md                       # This file
```

## 🚀 Running Tests

### All Tests

```bash
# Run all tests (unit + integration + e2e)
npm run test:all

# Run with coverage
npm run test:coverage
```

### Unit Tests

```bash
# Run unit tests only
npm test

# Run in watch mode
npm run test:watch

# Run CI mode
npm run test:ci
```

### Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific integration test
npm test tests/integration/sentry-monitoring.test.js
npm test tests/integration/merge-conflict-system.test.js
npm test tests/integration/circleci-pipeline.test.js
```

### End-to-End Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run specific e2e test
npm test tests/e2e/full-workflow.test.js
```

## 📋 Test Coverage

### Integration Tests

#### 1. Sentry Monitoring System (`sentry-monitoring.test.js`)

Tests the complete Sentry monitoring pipeline:

**Coverage:**
- ✅ Webhook signature verification (valid/invalid/missing)
- ✅ Priority assessment algorithm (6-factor evaluation)
- ✅ Error grouping (MD5 hashing)
- ✅ Smart filtering (low priority filtering)
- ✅ Escalation creation (priority-based cooldowns)
- ✅ Webhook endpoint integration

**Key Test Scenarios:**
```javascript
describe('Priority Assessment Algorithm', () => {
  it('should assess critical priority for fatal errors')
  it('should assess critical priority for high occurrence errors')
  it('should assess high priority for production errors')
  it('should assess medium priority for warnings')
  it('should assess low priority for single info messages')
});
```

#### 2. Merge Conflict Resolution System (`merge-conflict-system.test.js`)

Tests the complete merge conflict resolution pipeline:

**Coverage:**
- ✅ Conflict detection (git status, conflict markers)
- ✅ Strategy selection (7 strategies)
- ✅ Package lock resolution (regeneration)
- ✅ Package JSON resolution (intelligent merging)
- ✅ JSON merge resolution (deep merging)
- ✅ File backup and restore
- ✅ Validation (JSON syntax, no conflict markers)
- ✅ End-to-end resolution

**Resolution Strategies Tested:**
1. `packageLock` - Full package-lock.json regeneration
2. `packageJson` - Intelligent dependency merging
3. `jsonMerge` - Deep JSON object merging
4. `yamlMerge` - YAML conflict resolution
5. `codeMerge` - Code analysis and merging
6. `documentMerge` - Documentation merging
7. `intelligentMerge` - Universal strategy

#### 3. CircleCI Pipeline (`circleci-pipeline.test.js`)

Tests the CI/CD pipeline configuration and workflows:

**Coverage:**
- ✅ Pipeline configuration validation
- ✅ Cache strategy (multi-layer caching)
- ✅ Parallel execution configuration
- ✅ Security scanning (vulnerability + secret + SAST)
- ✅ Performance monitoring (bundle analysis, size limits)
- ✅ Deployment configuration (Vercel env validation)
- ✅ Artifact storage (test results, coverage, security reports)
- ✅ Scheduled workflows (nightly, weekly)
- ✅ Error handling (timeouts, fail-fast)
- ✅ Workspace persistence

**Key Validations:**
```javascript
describe('Security Scanning', () => {
  it('should include vulnerability scanning job')
  it('should include secret scanning job')
  it('should fail build on critical vulnerabilities')
});
```

### End-to-End Tests

#### Full Workflow Tests (`full-workflow.test.js`)

Tests complete workflows from error detection to resolution:

**Coverage:**

1. **Critical Error Workflow**
   - Production error → Webhook → Prioritization → Escalation → Notification → Resolution

2. **Merge Conflict Workflow**
   - Conflict detection → Automatic resolution → Backup creation → Validation → Notification

3. **CI/CD Pipeline Workflow**
   - Commit → Pipeline trigger → Parallel jobs → Security scans → Build → Deployment

4. **Health Monitoring Workflow**
   - Baseline health → Degradation detection → Health changes → Escalation → Notification

5. **Multi-System Integration**
   - Production error + Merge conflict + CI/CD pipeline + Deployment coordination

**Example Test:**
```javascript
it('should handle critical error from detection to resolution', async () => {
  // 1. Simulate production error
  // 2. Send webhook to API
  // 3. Verify escalation was created
  // 4. Verify notification was sent
  // 5. Simulate resolution
  // 6. Verify escalation is closed
});
```

## 🧪 Test Requirements

### Prerequisites

```bash
# Install dependencies
npm install

# Required environment variables for tests
export SENTRY_WEBHOOK_SECRET="test-secret"
export SENTRY_PROCESS_LOW_PRIORITY="false"
```

### Test Dependencies

```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@testing-library/jest-dom": "^6.8.0",
    "@testing-library/react": "^16.3.0",
    "js-yaml": "^4.1.0"
  }
}
```

## 📊 Expected Test Results

### Success Criteria

✅ **Unit Tests**: >90% coverage, all tests passing
✅ **Integration Tests**: >80% coverage, all critical paths tested
✅ **E2E Tests**: All workflows complete successfully
✅ **Total Coverage**: >85% across all test suites

### Performance Benchmarks

- Unit tests: <10 seconds
- Integration tests: <30 seconds
- E2E tests: <2 minutes
- Total test suite: <3 minutes

## 🐛 Debugging Tests

### Run Specific Test

```bash
# Run specific describe block
npm test -- -t "Webhook Signature Verification"

# Run specific test
npm test -- -t "should verify valid webhook signature"

# Run with verbose output
npm test -- --verbose
```

### Debug Mode

```bash
# Node.js debugging
node --inspect-brk node_modules/.bin/jest tests/integration/sentry-monitoring.test.js

# VS Code debugging - add to launch.json:
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal"
}
```

### Common Issues

**Issue**: Tests timeout
**Solution**: Increase jest timeout
```javascript
jest.setTimeout(10000); // 10 seconds
```

**Issue**: Cannot find module
**Solution**: Check jest.config.js moduleNameMapper
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```

**Issue**: Tests fail in CI but pass locally
**Solution**: Check environment variables, ensure clean state
```bash
# Clean before running tests
npm run clean
npm test
```

## 📈 Test Metrics

Track test metrics in your CI/CD pipeline:

```yaml
# CircleCI example
- run:
    name: Run Tests with Coverage
    command: npm run test:all -- --coverage
- store_test_results:
    path: coverage
- store_artifacts:
    path: coverage
    destination: coverage-reports
```

## 🔄 Continuous Testing

### Pre-commit Hooks

Add to `.git/hooks/pre-commit`:
```bash
#!/bin/sh
npm test -- --bail --findRelatedTests
```

### Watch Mode for Development

```bash
# Watch unit tests
npm run test:watch

# Watch integration tests
npm run test:integration -- --watch

# Watch all with coverage
npm test -- --watch --coverage
```

## 📝 Writing New Tests

### Test Template

```javascript
/**
 * Tests for [Feature Name]
 *
 * Tests the complete [feature] workflow:
 * - [Step 1]
 * - [Step 2]
 * - [Step 3]
 */

describe('[Feature Name] - Tests', () => {
  // Setup
  beforeAll(() => {
    // Global setup
  });

  beforeEach(() => {
    // Per-test setup
  });

  afterEach(() => {
    // Per-test cleanup
  });

  afterAll(() => {
    // Global cleanup
  });

  describe('[Feature Aspect]', () => {
    it('should [expected behavior]', () => {
      // Arrange
      const input = {};

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Best Practices

1. **Descriptive test names**: Use "should" statements
2. **Arrange-Act-Assert**: Clear test structure
3. **One assertion per test**: Focus on single behavior
4. **Mock external dependencies**: Isolate tests
5. **Clean up resources**: Prevent test pollution
6. **Test edge cases**: Cover error scenarios
7. **Use beforeEach/afterEach**: Ensure clean state

## 🎯 Next Steps

1. **Increase Coverage**: Target 95%+ for critical systems
2. **Add Performance Tests**: Benchmark key operations
3. **Visual Regression Tests**: UI component testing
4. **Load Tests**: API endpoint stress testing
5. **Security Tests**: Penetration testing automation

---

**Test Suite Version**: 1.0.0
**Last Updated**: 2025-01-16
**Maintainer**: Development Team
