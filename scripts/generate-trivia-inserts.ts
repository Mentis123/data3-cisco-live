#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TriviaItem {
  id: string;
  category: string;
  stem: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  correct_index: number;
  drop_index: number;
  hint_9s: string;
  difficulty: number;
  tags: string;
  explanation: string;
}

// Read the JSON file
const jsonPath = path.join(__dirname, '../docs/trivia-items-starter.json');
const triviaData: TriviaItem[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

// Helper to escape single quotes for SQL
function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

// Helper to convert tags string to PostgreSQL array literal
function tagsToArray(tags: string): string {
  const tagArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
  if (tagArray.length === 0) return "'{}'";
  const escaped = tagArray.map(t => `"${escapeSql(t)}"`).join(',');
  return `'{${escaped}}'`;
}

// Helper to convert choices to PostgreSQL array literal
function choicesToArray(a: string, b: string, c: string): string {
  const escaped = [a, b, c].map(ch => `"${escapeSql(ch)}"`).join(',');
  return `'{${escaped}}'`;
}

// Generate SQL
const sqlStatements: string[] = [];

sqlStatements.push('-- Generated SQL INSERT statements for trivia_items');
sqlStatements.push('-- Run this in your Neon SQL Editor');
sqlStatements.push('');
sqlStatements.push('BEGIN;');
sqlStatements.push('');

for (const item of triviaData) {
  const sql = `INSERT INTO trivia_items (
  id,
  category,
  stem,
  choices,
  correct_index,
  drop_index,
  hint_9s,
  difficulty,
  tags,
  explanation
) VALUES (
  '${escapeSql(item.id)}',
  '${escapeSql(item.category)}',
  '${escapeSql(item.stem)}',
  ${choicesToArray(item.choice_a, item.choice_b, item.choice_c)},
  ${item.correct_index},
  ${item.drop_index},
  '${escapeSql(item.hint_9s)}',
  ${item.difficulty},
  ${tagsToArray(item.tags)},
  '${escapeSql(item.explanation)}'
);`;

  sqlStatements.push(sql);
  sqlStatements.push('');
}

sqlStatements.push('COMMIT;');
sqlStatements.push('');
sqlStatements.push(`-- Total: ${triviaData.length} trivia items inserted`);

// Write to output file
const outputPath = path.join(__dirname, '../docs/trivia-inserts.sql');
fs.writeFileSync(outputPath, sqlStatements.join('\n'), 'utf-8');

console.log(`✅ Generated SQL INSERT statements for ${triviaData.length} trivia items`);
console.log(`📄 Output: ${outputPath}`);
