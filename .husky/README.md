# Git Hooks Configuration

This project uses Husky to enforce code quality and naming conventions.

## Pre-commit Hook

**What it does:**

- Validates branch naming convention
- Runs all tests before allowing commits

**Branch naming requirements:**

- `feature/` - New features (e.g., `feature/user-auth`)
- `patch/` - Small improvements (e.g., `patch/ui-tweaks`)
- `fix/` - Bug fixes (e.g., `fix/login-bug`)
- `terraform/` - Infrastructure changes (e.g., `terraform/aws-setup`)
- `azure/` - Azure-specific changes (e.g., `azure/storage-config`)

**Allowed branches without prefix:**

- `main`
- `develop`

## Commit Message Hook

**Format required:**

```
type(scope): description

Examples:
feat: add user authentication
fix(api): resolve login endpoint bug
docs: update README
test: add template service tests
```

**Valid types:**

- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation
- `style` - Code formatting
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance tasks
- `perf` - Performance improvements
- `ci` - CI/CD changes
- `build` - Build system changes
- `revert` - Reverting changes

## Bypassing Hooks (Emergency Only)

```bash
git commit --no-verify -m "emergency fix"
```

⚠️ **Only use in emergencies** - hooks ensure code quality!
