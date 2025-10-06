#!/usr/bin/env node
/**
 * Automated script to fix 'any' types in the codebase
 * Replaces common 'any' patterns with proper TypeScript types
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Pattern replacements (order matters!)
const replacements = [
  // Supabase 'as any' casts
  {
    pattern: /\(supabase as any\)/g,
    replacement: 'supabase',
    description: 'Remove unnecessary Supabase type casts',
  },

  // Generic catch blocks
  {
    pattern: /catch \(error: any\)/g,
    replacement: 'catch (error: unknown)',
    description: 'Replace any with unknown in catch blocks',
  },

  // .map((item: any) =>
  {
    pattern: /\.map\(\(([a-zA-Z_][a-zA-Z0-9_]*): any\) =>/g,
    replacement: '.map(($1: DatabaseRecord) =>',
    description: 'Replace any in map functions with DatabaseRecord',
  },

  // .filter((item: any) =>
  {
    pattern: /\.filter\(\(([a-zA-Z_][a-zA-Z0-9_]*): any\) =>/g,
    replacement: '.filter(($1: DatabaseRecord) =>',
    description: 'Replace any in filter functions with DatabaseRecord',
  },

  // Function parameters: (data: any)
  {
    pattern: /\(([a-zA-Z_][a-zA-Z0-9_]*): any\)/g,
    replacement: '($1: unknown)',
    description: 'Replace any function parameters with unknown',
  },

  // Array types: any[]
  {
    pattern: /: any\[\]/g,
    replacement: ': unknown[]',
    description: 'Replace any[] with unknown[]',
  },

  // Record types
  {
    pattern: /Record<string, any>/g,
    replacement: 'Record<string, unknown>',
    description: 'Replace Record<string, any> with Record<string, unknown>',
  },

  // Insert/Update operations: .insert(... as any)
  {
    pattern: /\.insert\([^)]*\bas any\)/g,
    replacement: (match) => match.replace(' as any', ''),
    description: 'Remove as any from insert operations',
  },

  // Select operations
  {
    pattern: /\.select\([^)]*\bas any\)/g,
    replacement: (match) => match.replace(' as any', ''),
    description: 'Remove as any from select operations',
  },
];

// Additional imports needed
const imports = {
  'DatabaseRecord': "import type { DatabaseRecord } from '@/types/api-types'",
  'CaughtError': "import type { CaughtError, getErrorMessage } from '@/types/api-types'",
  'TypedSupabaseClient': "import type { TypedSupabaseClient } from '@/types/supabase-helpers'",
};

// Files to process (from grep results) - currently unused but kept for future use
function _getFilesToProcess() {
  try {
    const result = execSync('npx tsx -e "import {glob} from \'glob\'; glob(\'src/**/*.{ts,tsx}\').then(console.log)"', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result.split('\\n').filter(f => f.trim());
  } catch (_e) {
    console.error('Failed to get file list, using manual list');
    return [];
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  let changes = [];

  // Apply replacements
  replacements.forEach(({ pattern, replacement, description }) => {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      content = content.replace(pattern, replacement);
      modified = true;
      changes.push(`  - ${description}: ${matches.length} occurrences`);
    }
  });

  // Add imports if needed
  if (modified) {
    const needsImports = [];

    if (content.includes('DatabaseRecord') && !content.includes("from '@/types/api-types'")) {
      needsImports.push(imports.DatabaseRecord);
    }

    if (needsImports.length > 0) {
      // Find the last import statement
      const importRegex = /^import .* from ['"].*['"];?$/gm;
      const importMatches = [...content.matchAll(importRegex)];

      if (importMatches.length > 0) {
        const lastImport = importMatches[importMatches.length - 1];
        const insertIndex = lastImport.index + lastImport[0].length;
        content = content.slice(0, insertIndex) + '\\n' + needsImports.join('\\n') + content.slice(insertIndex);
      }
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Fixed: ${filePath}`);
    changes.forEach(c => console.log(c));
    return changes.length;
  }

  return 0;
}

// Main execution
console.log('Starting automated any-type fixes...\\n');

const srcDir = path.join(__dirname, 'src');
const files = [];

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      walkDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }
}

walkDir(srcDir);

console.log(`Found ${files.length} TypeScript files to process\\n`);

let totalChanges = 0;
let filesModified = 0;

files.forEach(file => {
  const changes = processFile(file);
  if (changes > 0) {
    totalChanges += changes;
    filesModified++;
  }
});

console.log(`\\n📊 Summary:`);
console.log(`  Total files processed: ${files.length}`);
console.log(`  Files modified: ${filesModified}`);
console.log(`  Total changes: ${totalChanges}`);
console.log(`\\nNote: Some 'any' types may still require manual review.`);
