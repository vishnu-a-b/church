#!/bin/bash

# Script to update super-admin pages with church selector
# Pages: houses, dues, stothrakazhcha, news, events

PAGES=("houses" "dues" "news" "events")

for PAGE in "${PAGES[@]}"; do
  FILE="/Users/vishnuab/Official/Church/client/app/super-admin/dashboard/$PAGE/page.tsx"

  if [ -f "$FILE" ]; then
    echo "Updating $PAGE..."

    # 1. Change church_admin to super_admin
    sed -i.bak "s/createRoleApi('church_admin')/createRoleApi('super_admin')/g" "$FILE"

    echo "✅ Updated $PAGE"
  else
    echo "⚠️  File not found: $FILE"
  fi
done

echo ""
echo "✅ Batch update complete! Now updating individual page logic..."
