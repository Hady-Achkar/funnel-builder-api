@echo off
REM Git Add, Commit, and Push Script for Windows
REM Usage: git-push.bat "Your commit message"

if "%~1"=="" (
    echo Please provide a commit message
    echo Usage: %0 "Your commit message"
    exit /b 1
)

echo [INFO] Adding changes...
git add .

echo [INFO] Committing changes...
git commit -m "%~1

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

echo [INFO] Pushing to remote...
git push

if %errorlevel% equ 0 (
    echo [SUCCESS] All done! ✨
) else (
    echo [ERROR] Push failed
    exit /b 1
)