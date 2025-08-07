#!/bin/bash

set -e

echo "🚀 Starting push to develop branch..."

if [ ! -d .git ]; then
    echo "❌ Error: Not a git repository"
    exit 1
fi

CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "develop" ]; then
    echo "⚠️  Warning: You're not on develop branch"
    read -p "Do you want to switch to develop? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout develop
        echo "✅ Switched to develop branch"
    else
        echo "❌ Aborted: Not on develop branch"
        exit 1
    fi
fi

echo "📊 Git status:"
git status --short

if [[ -n $(git status --porcelain) ]]; then
    echo "📝 You have uncommitted changes:"
    git status --short
    read -p "Do you want to add and commit these changes? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        read -p "Enter commit message: " commit_msg
        git commit -m "$commit_msg"
        echo "✅ Changes committed"
    fi
fi

echo "🔄 Pulling latest changes from develop..."
git pull origin develop

echo "⬆️  Pushing to develop branch..."
git push origin develop

echo "✅ Successfully pushed to develop branch!"

echo ""
echo "📋 Latest commits:"
git log --oneline -5