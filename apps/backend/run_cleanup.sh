#!/bin/bash
# Script to run cleanup with proper environment variables

# Load cleanup environment variables
if [ -f .env.cleanup ]; then
    export $(cat .env.cleanup | grep -v '^#' | xargs)
else
    echo "❌ .env.cleanup file not found"
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

echo "🧹 Running file cleanup analysis..."
python scripts/cleanup_original_files.py

echo ""
echo "To actually delete files, run:"
echo "python scripts/cleanup_original_files.py --delete"