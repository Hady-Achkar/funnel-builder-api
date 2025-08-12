# Git Automation Scripts

This project includes several Git automation scripts to streamline your development workflow.

## 📝 Available Scripts

### 1. `git-push.sh` (Interactive Script)

**Full-featured script with safety checks and confirmation prompts.**

```bash
# Usage
./git-push.sh "Your commit message"
./git-push.sh "Your commit message" --no-claude

# Examples
./git-push.sh "Fix authentication bug in login controller"
./git-push.sh "Add user validation" --no-claude
```

**Features:**

- ✅ Interactive confirmation before committing
- ✅ Colored output for better readability
- ✅ Git repository validation
- ✅ Shows git status before committing
- ✅ Automatic Claude Code signature (optional)
- ✅ Error handling and validation
- ✅ Shows commit info after push

### 2. `quick-push.sh` (Fast Script)

**No prompts, just push - for quick iterations.**

```bash
# Usage
./quick-push.sh "Your commit message"

# Example
./quick-push.sh "Quick fix for typo"
```

**Features:**

- 🚀 No confirmation prompts
- 🚀 Automatic Claude Code signature
- 🚀 Minimal output
- 🚀 Perfect for rapid development

### 3. `git-push.bat` (Windows Script)

**Windows batch file equivalent.**

```cmd
REM Usage
git-push.bat "Your commit message"

REM Example
git-push.bat "Update documentation"
```

## 🔧 Setup Instructions

### For Unix/Linux/macOS:

1. **Make scripts executable:**

   ```bash
   chmod +x git-push.sh quick-push.sh
   ```

2. **Run the scripts:**
   ```bash
   ./git-push.sh "Your message"
   ./quick-push.sh "Your message"
   ```

### For Windows:

1. **Run the batch file:**
   ```cmd
   git-push.bat "Your message"
   ```

## 📋 What Each Script Does

1. **`git add .`** - Stages all changes
2. **`git commit -m "message"`** - Commits with your message + Claude signature
3. **`git push`** - Pushes to the current branch on origin

## 🎯 When to Use Which Script

| Script          | Use Case                              | Best For                                       |
| --------------- | ------------------------------------- | ---------------------------------------------- |
| `git-push.sh`   | Production changes, important commits | When you want confirmation and detailed output |
| `quick-push.sh` | Development, quick fixes, iterations  | When you want speed and simplicity             |
| `git-push.bat`  | Windows development                   | Windows users who prefer batch files           |

## ⚠️ Important Notes

- **Always review your changes** before using these scripts
- Scripts will **add ALL unstaged files** (`git add .`)
- Make sure you're on the **correct branch** before running
- Scripts include **Claude Code signature** by default (except with `--no-claude` flag)

## 🔒 Safety Features

- ✅ Checks if you're in a Git repository
- ✅ Validates remote origin exists
- ✅ Shows git status before committing
- ✅ Proper error handling and exit codes
- ✅ Confirmation prompts (interactive script only)

## 🎨 Output Examples

### Interactive Script (`git-push.sh`):

```
[INFO] Checking git status...
M  src/app.ts
A  src/new-feature.ts

Do you want to add all changes and commit? (y/N): y
[INFO] Adding all changes...
[INFO] Committing changes...
[INFO] Current branch: develop
[INFO] Pushing to remote...
[SUCCESS] Successfully pushed to remote!

[INFO] Last commit:
abc1234 Add new authentication feature
[INFO] Remote: https://github.com/user/repo.git
[SUCCESS] All done! ✨
```

### Quick Script (`quick-push.sh`):

```
📝 Adding changes...
💾 Committing...
🚀 Pushing...
✅ Done!
```

## 🛠️ Customization

You can modify these scripts to fit your workflow:

- **Change commit message format**
- **Add pre-commit hooks**
- **Customize output colors**
- **Add additional git commands**
- **Integrate with CI/CD pipelines**

## 📞 Troubleshooting

**Script not executable:**

```bash
chmod +x git-push.sh quick-push.sh
```

**Permission denied:**

```bash
sudo chmod +x git-push.sh quick-push.sh
```

**Windows script not working:**

- Make sure you're in Command Prompt or PowerShell
- Check if Git is installed and in PATH

Happy coding! 🚀
