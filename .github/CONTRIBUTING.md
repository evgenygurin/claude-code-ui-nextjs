# Contributing Guidelines

## 🚨 IMPORTANT: Never Push to Main!

**ALL changes MUST go through Pull Requests!**

### Workflow Rules

1. **NEVER push directly to `main` branch**
2. **ALWAYS create a feature branch**
3. **ALWAYS create a Pull Request**
4. **ALWAYS wait for review (Claude will auto-review)**
5. **ONLY merge after approval**

### Branch Naming Convention

```text
feature/description    # New features
fix/description       # Bug fixes
docs/description      # Documentation
refactor/description  # Code refactoring
test/description      # Test additions
chore/description     # Maintenance tasks
```

### Creating a Pull Request

```bash
# 1. Create a new branch
git checkout -b feature/your-feature-name

# 2. Make your changes
# ... edit files ...

# 3. Commit your changes
git add .
git commit -m "feat: your feature description"

# 4. Push to GitHub
git push origin feature/your-feature-name

# 5. Create PR using GitHub CLI
gh pr create --title "feat: your feature" --body "Description of changes"

# Or create PR on GitHub.com
```

### Commit Message Format

```bash
type(scope): brief description

Detailed description if needed.

Closes #issue-number
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, no code change
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

### Pull Request Process

1. **Create PR** - Claude automatically assigns as reviewer
2. **Review** - Claude reviews within minutes
3. **Fix Issues** - Address any feedback
4. **Approval** - Wait for approval
5. **Merge** - Squash and merge

### Branch Protection Rules

The `main` branch is protected with:
- ✅ Require pull request reviews before merging
- ✅ Dismiss stale pull request approvals
- ✅ Require review from CODEOWNERS
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Include administrators in restrictions
- ✅ Restrict who can push to matching branches

### Claude Integration

When you create a PR:
1. Claude is automatically assigned as reviewer
2. Visual progress tracking shows review status
3. You'll get detailed feedback with inline comments
4. Claude can fix issues if you ask: `@claude fix this`

### Quick Commands

```bash
# Create feature branch
git checkout -b feature/awesome-feature

# Create PR with Claude review
gh pr create --title "feat: awesome feature" \
  --body "@claude review this implementation"

# Fix issues Claude found
@claude fix the TypeScript errors

# Merge after approval
gh pr merge --squash
```

### Emergency Fixes

Even for urgent fixes:
1. Create branch: `git checkout -b fix/critical-bug`
2. Make fix
3. Create PR: `gh pr create --title "fix: critical bug"`
4. Add label: `gh pr edit --add-label "critical"`
5. Claude will prioritize critical PRs

### Remember

**NO DIRECT PUSHES TO MAIN! EVER!**

All changes go through PR → Review → Merge

This ensures:
- Code quality
- Automated testing
- Security scanning
- Documentation
- Proper history
