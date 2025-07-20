#!/bin/bash

# Quick Git Push Script - No prompts, just push
# Usage: ./quick-push.sh "commit message"

if [ $# -eq 0 ]; then
    echo "❌ Please provide a commit message"
    echo "Usage: $0 \"Your commit message\""
    exit 1
fi

echo "📝 Adding changes..."
git add .

echo "💾 Committing..."
git commit -m "$1

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

echo "🚀 Pushing..."
git push

echo "✅ Done!"