#!/bin/bash

# Git Aliases Setup Script
# This script adds convenient git aliases for the automation scripts

echo "🔧 Setting up Git aliases..."

# Add aliases to ~/.bashrc or ~/.zshrc
SHELL_RC=""
if [ -n "$ZSH_VERSION" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_RC="$HOME/.bashrc"
else
    echo "⚠️  Unknown shell. Please add aliases manually."
    exit 1
fi

# Check if aliases already exist
if grep -q "# Git Push Scripts" "$SHELL_RC" 2>/dev/null; then
    echo "⚠️  Aliases already exist in $SHELL_RC"
    exit 0
fi

# Add aliases
echo "" >> "$SHELL_RC"
echo "# Git Push Scripts" >> "$SHELL_RC"
echo "alias gp='./git-push.sh'" >> "$SHELL_RC"
echo "alias qp='./quick-push.sh'" >> "$SHELL_RC"
echo "alias gpu='./git-push.sh'" >> "$SHELL_RC"

echo "✅ Added aliases to $SHELL_RC:"
echo "   gp  = ./git-push.sh"
echo "   qp  = ./quick-push.sh" 
echo "   gpu = ./git-push.sh"
echo ""
echo "📝 Reload your shell or run: source $SHELL_RC"
echo ""
echo "🎯 Usage examples:"
echo "   gp \"Fix authentication bug\""
echo "   qp \"Quick typo fix\""
echo "   gpu \"Add new feature\" --no-claude"