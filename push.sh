#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
print_status "Current branch: $CURRENT_BRANCH"

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_warning "You have uncommitted changes"
    
    # Show status
    echo ""
    git status --short
    echo ""
    
    read -p "Do you want to commit these changes? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " COMMIT_MSG
        
        if [ -z "$COMMIT_MSG" ]; then
            print_error "Commit message cannot be empty"
            exit 1
        fi
        
        git add .
        git commit -m "$COMMIT_MSG"
        print_status "Changes committed"
    else
        print_warning "Skipping commit. Only pushing existing commits."
    fi
fi

# Fetch latest from remote
print_status "Fetching latest from remote..."
git fetch origin

# Check if develop branch exists locally
if ! git show-ref --verify --quiet refs/heads/develop; then
    print_warning "Local develop branch doesn't exist. Creating it..."
    git checkout -b develop origin/develop
    CURRENT_BRANCH="develop"
fi

# If not on develop, ask if user wants to switch
if [ "$CURRENT_BRANCH" != "develop" ]; then
    read -p "You're on branch '$CURRENT_BRANCH'. Switch to develop? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Check if there are changes that would be lost
        if ! git diff --quiet || ! git diff --cached --quiet; then
            print_error "You have uncommitted changes. Please commit or stash them first."
            exit 1
        fi
        
        git checkout develop
        print_status "Switched to develop branch"
        CURRENT_BRANCH="develop"
    fi
fi

# If on develop, pull latest changes
if [ "$CURRENT_BRANCH" == "develop" ]; then
    print_status "Pulling latest changes from origin/develop..."
    git pull origin develop
fi

# Push to remote
print_status "Pushing to origin/$CURRENT_BRANCH..."
if git push origin "$CURRENT_BRANCH"; then
    print_status "Successfully pushed to origin/$CURRENT_BRANCH"
    
    # Show latest commit
    echo ""
    print_status "Latest commit:"
    git log --oneline -1
    
    # Show remote URL
    echo ""
    print_status "Remote URL:"
    git remote get-url origin
else
    print_error "Failed to push to origin/$CURRENT_BRANCH"
    exit 1
fi

echo ""
print_status "Done!"