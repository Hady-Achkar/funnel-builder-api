# Claude Development Guide

## CRITICAL: Must Read Files Before Any Work

### 1. Architecture Standards

**ALWAYS read `ARCHITECTURE.md` first** - This file contains:

- Mandatory file structure patterns
- Type safety requirements
- Service/Controller separation of concerns
- Testing requirements
- Route migration tracking

### 2. Planning Context

- Check `next_plan.md` for Business/Agency plan implementation
- If the user's request relates to plans, refer to next_plan.md
- If unrelated to the plan, continue with normal workflow

## Important Rules

- NEVER use `any` or `unknown` types
- ALWAYS follow the architecture patterns in ARCHITECTURE.md
- Update ARCHITECTURE.md when completing route migrations

## Development Workflow

- Create a script to push to GitHub and push to develop branch
- Verify and ensure .gitignore is correctly configured to exclude unnecessary files
