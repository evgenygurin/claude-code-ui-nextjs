# Claude Code Integration Guide

## 🚀 Overview

This repository is enhanced with Claude Code Action - an AI-powered assistant that can review code, fix issues, implement features, and maintain code quality automatically.

## 🎯 Key Features

### 1. **Automatic PR Assignment & Review**
- Claude is automatically assigned as a reviewer on all PRs
- Performs comprehensive code review with visual progress tracking
- Provides inline comments and suggestions
- Rates PRs: 🟢 APPROVED | 🟡 NEEDS_CHANGES | 🔴 BLOCKED

### 2. **Interactive Commands**
Mention `@claude` in any comment with these commands:

| Command | Description | Example |
|---------|-------------|---------|
| `@claude fix` | Fix an issue and create PR | `@claude fix the TypeScript error in auth.ts` |
| `@claude review` | Perform code review | `@claude review this PR for security` |
| `@claude explain` | Explain code or concepts | `@claude explain how this WebSocket works` |
| `@claude test` | Write tests | `@claude test the new API endpoints` |
| `@claude optimize` | Optimize performance | `@claude optimize the bundle size` |
| `@claude document` | Write documentation | `@claude document the API methods` |
| `@claude security` | Security audit | `@claude security check authentication` |
| `@claude refactor` | Refactor code | `@claude refactor this component` |
| `@claude implement` | Implement features | `@claude implement dark mode toggle` |
| `@claude debug` | Debug issues | `@claude debug why tests are failing` |

### 3. **Automated Workflows**

#### Daily Security Scans (2 AM UTC)
- Vulnerability scanning
- Exposed secrets detection
- Authentication review
- XSS/SQL injection checks

#### Weekly Dependency Updates (Sundays)
- Check for outdated packages
- Prioritize security patches
- Test compatibility
- Create update PRs

#### Monthly Comprehensive Audit
- Full codebase analysis
- Performance review
- Documentation updates
- Technical debt assessment

### 4. **Issue Automation**
- Auto-triage new issues
- Add appropriate labels
- Set priority levels
- Check for duplicates
- Estimate complexity

### 5. **Manual Triggers**
Run specific tasks via GitHub Actions:
- `improve-code` - Comprehensive improvements
- `update-dependencies` - Update all dependencies
- `generate-tests` - Create test suites
- `optimize-performance` - Performance optimization
- `update-documentation` - Update all docs
- `security-hardening` - Security improvements
- `refactor-components` - Component refactoring
- `add-storybook-stories` - Generate stories

## 🔧 Configuration

### Required Secrets
```bash
ANTHROPIC_API_KEY    # Your Claude API key
GITHUB_TOKEN         # Automatically provided by GitHub
API_URL             # Optional: Your API endpoint
```

### Labels Used
- `claude-review` - PR needs Claude review
- `ai-enhanced` - AI-assisted code
- `claude-task` - Task for Claude
- `claude-help` - Request Claude assistance
- `needs-fix` - Auto-fix required

## 💡 Best Practices

### 1. PR Descriptions
Include clear context in PR descriptions:
```markdown
## Changes
- Added user authentication
- Implemented JWT tokens
- Added password reset flow

## Testing
- Unit tests added
- E2E tests for auth flow

@claude review for security
```

### 2. Issue Templates
Use templates for consistent Claude interactions:
```markdown
## Bug Report
**Description**: Login fails with 500 error
**Steps**: 1. Go to /login 2. Enter credentials 3. Click submit
**Expected**: Successful login
**Actual**: 500 error

@claude debug and fix
```

### 3. Feature Requests
Be specific with implementation requests:
```markdown
## Feature: Dark Mode
**Requirements**:
- Toggle in settings
- Persist preference
- Smooth transition
- Update all components

@claude implement dark mode with these requirements
```

## 📊 Visual Progress Tracking

When Claude works on tasks, you'll see:
```text
🤖 Claude is working on this...
- [ ] Analyzing code
- [ ] Identifying issues
- [ ] Implementing fixes
- [ ] Running tests
- [ ] Creating PR
```

Progress updates in real-time as tasks complete.

## 🔐 Security Features

### Automatic Security Reviews
- OWASP Top 10 analysis
- Dependency vulnerability scanning
- Authentication flow validation
- Input sanitization checks
- API security assessment

### Security Commands
```bash
# Full security audit
@claude security audit entire codebase

# Specific security check
@claude security check authentication flow

# Fix security issues
@claude fix security vulnerabilities
```

## 🚀 Advanced Usage

### Multi-Step Tasks
Claude can handle complex, multi-step requests:
```text
@claude implement user dashboard with:
1. Statistics cards
2. Recent activity feed
3. Quick actions menu
4. Responsive design
5. Real-time updates via WebSocket
```

### Conditional Automation
```yaml
# In issue description
If bug confirmed:
  @claude fix and create PR
Else:
  @claude add "needs-reproduction" label
```

### Batch Operations
```bash
@claude for all components:
1. Add TypeScript types
2. Write tests
3. Add Storybook stories
4. Update documentation
```

## 📈 Performance Optimization

### Bundle Analysis
```text
@claude analyze bundle size and suggest optimizations
```

### Code Splitting
```bash
@claude implement code splitting for better performance
```

### Caching Strategy
```bash
@claude optimize caching for API responses
```

## 🧪 Testing Automation

### Generate Tests
```bash
@claude generate tests for all components with 80% coverage
```

### E2E Tests
```bash
@claude write E2E tests for critical user flows
```

### Performance Tests
```sql
@claude create performance benchmarks
```

## 📝 Documentation Generation

### API Documentation
```text
@claude document all API endpoints with examples
```

### Component Documentation
```text
@claude generate component documentation with props tables
```

### Architecture Docs
```text
@claude document system architecture with diagrams
```

## 🔄 Continuous Improvement

Claude continuously learns and improves:
- Adapts to your coding style
- Learns from PR feedback
- Improves suggestions over time
- Updates based on best practices

## 🆘 Troubleshooting

### Claude Not Responding
1. Check if `@claude` is mentioned correctly
2. Verify ANTHROPIC_API_KEY is set
3. Check GitHub Actions logs
4. Ensure proper permissions

### Incorrect Suggestions
1. Provide more context in requests
2. Use specific commands
3. Include examples when possible
4. Reference existing code patterns

### Rate Limiting
- Claude has turn limits (configurable)
- Default: 20 turns per interaction
- Can be adjusted in workflow files

## 📚 Resources

- [Claude Code Action Docs](https://github.com/anthropics/claude-code-action)
- [GitHub Actions Docs](https://docs.github.com/actions)
- [Issue Templates](.github/ISSUE_TEMPLATE/)
- [PR Templates](.github/pull_request_template.md)

## 🎉 Tips & Tricks

1. **Quick Fixes**: `@claude fix` in PR comments for immediate fixes
2. **Batch Reviews**: Claude reviews multiple files efficiently
3. **Learning Mode**: Ask `@claude explain` to understand code
4. **Pair Programming**: Use Claude as a coding partner
5. **Code Generation**: Claude can generate boilerplate code
6. **Refactoring Helper**: Get refactoring suggestions
7. **Bug Hunter**: Claude can identify potential bugs
8. **Performance Coach**: Get performance tips
9. **Security Expert**: Regular security audits
10. **Documentation Writer**: Auto-generate docs

---

*Powered by Claude 3.5 Sonnet - Your AI Development Assistant* 🤖
