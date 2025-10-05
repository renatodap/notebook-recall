#!/bin/bash

# Fix unused parameters - prefix with underscore
files=(
  "src/app/api/email-capture/route.ts:88:export async function DELETE(request: NextRequest):export async function DELETE(_request: NextRequest)"
  "src/app/api/literature-review/generate/route.ts:94:export async function POST(request: NextRequest):export async function POST(_request: NextRequest)"
  "src/app/api/research-questions/route.ts:5:export async function GET(request: NextRequest):export async function GET(_request: NextRequest)"
  "src/app/api/synthesis/route.ts:5:export async function GET(request: NextRequest):export async function GET(_request: NextRequest)"
  "src/app/api/tags/route.ts:13:export async function GET(request: NextRequest):export async function GET(_request: NextRequest)"
  "src/app/api/workspaces/route.ts:65:export async function GET(request: NextRequest):export async function GET(_request: NextRequest)"
)

for entry in "${files[@]}"; do
  IFS=':' read -r file line old new <<< "$entry"
  if [ -f "$file" ]; then
    sed -i "s|$old|$new|g" "$file"
    echo "Fixed: $file"
  fi
done

echo "ESLint unused parameter fixes complete"
