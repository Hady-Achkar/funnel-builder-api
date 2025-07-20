#!/bin/bash

# Git Add, Commit, and Push Script
# Usage: ./git-push.sh "Your commit message"
# Usage: ./git-push.sh "Your commit message" --no-claude (without Claude signature)

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if commit message is provided
if [ $# -eq 0 ]; then
    print_error "Please provide a commit message"
    echo "Usage: $0 \"Your commit message\""
    echo "Usage: $0 \"Your commit message\" --no-claude"
    exit 1
fi

COMMIT_MESSAGE="$1"
NO_CLAUDE=false

# Check for --no-claude flag
if [ "$2" = "--no-claude" ]; then
    NO_CLAUDE=true
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository"
    exit 1
fi

# Check for uncommitted changes
if git diff-index --quiet HEAD --; then
    print_warning "No changes to commit"
    exit 0
fi

print_status "Checking git status..."
git status --short

# Ask for confirmation
echo
read -p "Do you want to add all changes and commit? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Operation cancelled"
    exit 0
fi

# Add all changes
print_status "Adding all changes..."
git add .

# Create commit message with or without Claude signature
if [ "$NO_CLAUDE" = true ]; then
    FULL_COMMIT_MESSAGE="$COMMIT_MESSAGE"
else
    FULL_COMMIT_MESSAGE=$(cat <<EOF
$COMMIT_MESSAGE

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)
fi

# Commit changes
print_status "Committing changes..."
git commit -m "$FULL_COMMIT_MESSAGE"

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
print_status "Current branch: $CURRENT_BRANCH"

# Check if remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    print_error "No remote 'origin' found"
    exit 1
fi

# Push to remote
print_status "Pushing to remote..."
if git push origin "$CURRENT_BRANCH"; then
    print_success "Successfully pushed to remote!"
    
    # Show the last commit
    echo
    print_status "Last commit:"
    git log --oneline -1
    
    # Show remote URL
    REMOTE_URL=$(git remote get-url origin)
    print_status "Remote: $REMOTE_URL"
else
    print_error "Failed to push to remote"
    exit 1
fi

print_success "All done! ✨"