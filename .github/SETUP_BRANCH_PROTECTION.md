# Setup Branch Protection for Main

## ⚠️ IMPORTANT: Manual Setup Required

Branch protection must be configured in GitHub Settings. Here's how:

### Steps to Enable Branch Protection:

1. **Go to Repository Settings**
   - Navigate to: https://github.com/evgenygurin/claude-code-ui-nextjs/settings
   - Click on "Branches" in the left sidebar

2. **Add Branch Protection Rule**
   - Click "Add rule"
   - Branch name pattern: `main`

3. **Configure Protection Settings**

   ✅ **Require a pull request before merging**
   - [x] Require approvals: 1
   - [x] Dismiss stale pull request approvals when new commits are pushed
   - [x] Require review from CODEOWNERS
   - [x] Restrict who can dismiss pull request reviews

   ✅ **Require status checks to pass before merging**
   - [x] Require branches to be up to date before merging
   - Add these status checks:
     - `claude` (Claude review)
     - `build` (if you have build checks)

   ✅ **Require conversation resolution before merging**
   - [x] All conversations must be resolved

   ✅ **Require signed commits** (Optional but recommended)
   - [x] All commits must be signed with GPG

   ✅ **Include administrators**
   - [x] Apply rules to administrators too

   ✅ **Restrict who can push to matching branches**
   - [x] Restrict pushes that create matching branches
   - Add users/teams who can push (usually none for main)

   ❌ **Do NOT enable:**
   - [ ] Allow force pushes
   - [ ] Allow deletions

4. **Save Changes**
   - Click "Create" to save the protection rule

### After Setup

Once configured, you'll see:
- 🔒 Lock icon next to `main` branch
- All pushes to main will be blocked
- Only PRs with approval can be merged

### Verify Protection

Test the protection:
```bash
# This should fail:
git push origin main
# Error: protected branch hook declined

# This should work:
git checkout -b test-branch
git push origin test-branch
gh pr create
```

### Emergency Override

If you absolutely must bypass (NOT RECOMMENDED):
1. Temporarily disable protection in settings
2. Make the change
3. **IMMEDIATELY re-enable protection**

### GitHub CLI Commands (for reference)

```bash
# View current protection
gh api repos/evgenygurin/claude-code-ui-nextjs/branches/main/protection

# Check if protected
gh api repos/evgenygurin/claude-code-ui-nextjs/branches/main | jq .protected
```

---

**Remember: NEVER PUSH DIRECTLY TO MAIN!**
