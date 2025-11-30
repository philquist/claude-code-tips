#!/usr/bin/env node
/**
 * Claude Code System Prompt Extractor v2
 *
 * Extracts the system prompt from the minified Claude Code CLI bundle.
 * Handles conditional template sections and resolves minified variable names.
 *
 * Usage: node extract-system-prompt.js [output-file]
 */

const fs = require('fs');
const path = require('path');

const CLI_PATH = path.join(process.env.HOME, '.claude/local/node_modules/@anthropic-ai/claude-code/cli.js');

if (!fs.existsSync(CLI_PATH)) {
  console.error('Error: Claude Code CLI not found at', CLI_PATH);
  process.exit(1);
}

const content = fs.readFileSync(CLI_PATH, 'utf8');

// Extract version
const versionMatch = content.match(/Version: ([\d.]+)/);
const version = versionMatch ? versionMatch[1] : 'unknown';

console.log('Claude Code System Prompt Extractor v2');
console.log('======================================');
console.log('CLI Version:', version);
console.log('');

/**
 * Variable mappings (minified -> readable)
 * Found by searching for patterns like: varName="ToolName"
 */
const VAR_MAP = {
  'E9': 'Bash',
  'R8': 'Task',
  'eI': 'TodoWrite',
  'h5': 'Read',
  'R5': 'Edit',
  'vX': 'Write',
  'xX': 'WebFetch',
  'DD': 'Glob',
  'uY': 'Grep',
  'uJ': 'AskUserQuestion',
  'ZC': 'Explore',
  'yb1': 'claude-code-guide',
  'F': 'SlashCommand',
  'Oq': 'SlashCommand',
};

/**
 * Replace all known variable patterns with readable names
 */
function replaceVariables(text) {
  // Simple variable references
  text = text.replace(/\$\{E9\}/g, 'Bash');
  text = text.replace(/\$\{R8\}/g, 'Task');
  text = text.replace(/\$\{eI\.name\}/g, 'TodoWrite');
  text = text.replace(/\$\{eI\}/g, 'TodoWrite');
  text = text.replace(/\$\{h5\}/g, 'Read');
  text = text.replace(/\$\{R5\}/g, 'Edit');
  text = text.replace(/\$\{vX\}/g, 'Write');
  text = text.replace(/\$\{xX\}/g, 'WebFetch');
  text = text.replace(/\$\{DD\}/g, 'Glob');
  text = text.replace(/\$\{uY\}/g, 'Grep');
  text = text.replace(/\$\{uJ\}/g, 'AskUserQuestion');
  text = text.replace(/\$\{ZC\.agentType\}/g, 'Explore');
  text = text.replace(/\$\{yb1\}/g, 'claude-code-guide');
  text = text.replace(/\$\{F\}/g, 'SlashCommand');

  return text;
}

/**
 * Extract content from conditional patterns like ${W.has(X)?`content`:""}
 * Returns the content inside the backticks
 */
function extractConditionalContent(text) {
  // Pattern: ${W.has(varName)?`content`:""}
  // We want to extract 'content' and keep it

  // First, handle the simple conditionals by extracting inner content
  let result = text;

  // Match ${W.has(something)?` and extract until closing `:""}
  const conditionalPattern = /\$\{W\.has\([^)]+\)\?\`([^`]*)\`:""\}/g;
  result = result.replace(conditionalPattern, '$1');

  // Match ${varName?`content`:""} patterns
  const simpleConditional = /\$\{[A-Za-z0-9_]+\?\`([^`]*)\`:""\}/g;
  result = result.replace(simpleConditional, '$1');

  // Match ${Y!==null?"":` and remove it (keeping content after)
  result = result.replace(/\$\{Y!==null\?"":"?\s*\`/g, '');

  // Match ${Y===null||Y.keepCodingInstructions===!0?` and remove
  result = result.replace(/\$\{Y===null\|\|Y\.keepCodingInstructions===!0\?\`/g, '');

  // Clean up orphaned closing patterns
  result = result.replace(/\`:""\}/g, '');
  result = result.replace(/\`:""}/g, '');

  return result;
}

/**
 * Extract a large section of text starting from a marker
 */
function extractLargeSection(startMarker, maxLen = 8000) {
  const idx = content.indexOf(startMarker);
  if (idx === -1) return null;

  // Find the template literal boundaries more carefully
  let end = idx;
  let depth = 0;

  for (let i = idx; i < Math.min(content.length, idx + maxLen); i++) {
    const char = content[i];
    const prevChar = content[i - 1];

    // Track ${} depth
    if (char === '$' && content[i + 1] === '{') {
      depth++;
    } else if (char === '}' && depth > 0) {
      depth--;
    }

    // End at backtick only if we're not inside ${}
    if (char === '`' && prevChar !== '\\' && depth === 0) {
      end = i;
      break;
    }
  }

  let text = content.slice(idx, end);
  text = extractConditionalContent(text);
  text = replaceVariables(text);

  return text;
}

/**
 * Extract section until a specific end marker (for sections split across functions)
 */
function extractSectionUntil(startMarker, endMarker, maxLen = 8000) {
  const idx = content.indexOf(startMarker);
  if (idx === -1) return null;

  let end = idx + maxLen;

  // Find the end marker
  const endIdx = content.indexOf(endMarker, idx);
  if (endIdx !== -1 && endIdx < end) {
    end = endIdx;
  }

  let text = content.slice(idx, end);
  text = extractConditionalContent(text);
  text = replaceVariables(text);

  return text;
}

/**
 * Extract tool description
 */
function extractToolDescription(searchStr) {
  const idx = content.indexOf(searchStr);
  if (idx === -1) return null;

  // Go back to find 'description:'
  let start = idx;
  for (let i = idx; i > Math.max(0, idx - 50); i--) {
    if (content[i] === '`' || content[i] === '"') {
      start = i + 1;
      break;
    }
  }

  // Find the end of the description string
  let end = idx;
  let quote = content[start - 1]; // ` or "
  for (let i = idx; i < Math.min(content.length, idx + 10000); i++) {
    if (content[i] === quote && content[i - 1] !== '\\') {
      end = i;
      break;
    }
  }

  return content.slice(start, end);
}

// Build the output
let sections = [];

// === HEADER ===
sections.push(`# Claude Code System Prompt (v${version})
# Extracted: ${new Date().toISOString().split('T')[0]}
# Source: ~/.claude/local/node_modules/@anthropic-ai/claude-code/cli.js

################################################################################
# IDENTITY
################################################################################

You are Claude Code, Anthropic's official CLI for Claude.
You are an interactive CLI tool that helps users with software engineering tasks.
Use the instructions below and the tools available to you to assist the user.

IMPORTANT: Assist with authorized security testing, defensive security, CTF
challenges, and educational contexts. Refuse requests for destructive techniques,
DoS attacks, mass targeting, supply chain compromise, or detection evasion for
malicious purposes. Dual-use security tools (C2 frameworks, credential testing,
exploit development) require clear authorization context.

IMPORTANT: You must NEVER generate or guess URLs for the user unless you are
confident that the URLs are for helping the user with programming. You may use
URLs provided by the user in their messages or local files.

If the user asks for help or wants to give feedback:
- /help: Get help with using Claude Code
- Report issues at https://github.com/anthropics/claude-code/issues
`);

// === DOCUMENTATION LOOKUP ===
const docSection = extractLargeSection('# Looking up your own documentation:');
if (docSection) {
  sections.push(`
################################################################################
${docSection}
`);
}

// === TONE AND STYLE (combined section) ===
const toneSection = extractLargeSection('# Tone and style', 3000);
if (toneSection) {
  sections.push(`
################################################################################
${toneSection}
`);
}

// === TASK MANAGEMENT ===
const taskMgmt = extractLargeSection('# Task Management', 4000);
if (taskMgmt) {
  sections.push(`
################################################################################
${taskMgmt}
`);
}

// === ASKING QUESTIONS ===
const askingSection = extractLargeSection('# Asking questions as you work', 1000);
if (askingSection) {
  sections.push(`
################################################################################
${askingSection}
`);
}

// === DOING TASKS ===
const doingSection = extractLargeSection('# Doing tasks', 4000);
if (doingSection) {
  sections.push(`
################################################################################
${doingSection}
`);
}

// === TOOL USAGE POLICY ===
const toolPolicySection = extractLargeSection('# Tool usage policy', 4000);
if (toolPolicySection) {
  sections.push(`
################################################################################
${toolPolicySection}
`);
}

// === GIT COMMITS ===
// This section is in a different function in the bundle, so use extractSectionUntil
const gitSection = extractSectionUntil('# Committing changes with git', '# Creating pull requests', 4000);
if (gitSection) {
  sections.push(`
################################################################################
${gitSection}
`);
}

// === PULL REQUESTS ===
const prSection = extractSectionUntil('# Creating pull requests', '# Other common operations', 3000);
if (prSection) {
  sections.push(`
################################################################################
${prSection}
`);
}

// === CODE REFERENCES ===
const codeRefSection = extractLargeSection('# Code References', 1000);
if (codeRefSection) {
  sections.push(`
################################################################################
${codeRefSection}
`);
}

// === TOOL DESCRIPTIONS ===
sections.push(`
################################################################################
# TOOL DESCRIPTIONS
################################################################################
`);

const tools = [
  { name: 'Task', search: 'Launch a new agent to handle complex' },
  { name: 'Bash', search: 'Executes a given bash command in a persistent shell' },
  { name: 'Glob', search: 'Fast file pattern matching tool' },
  { name: 'Grep', search: 'A powerful search tool built on ripgrep' },
  { name: 'Read', search: 'Reads a file from the local filesystem' },
  { name: 'Edit', search: 'Performs exact string replacements in files' },
  { name: 'Write', search: 'Writes a file to the local filesystem' },
  { name: 'WebFetch', search: 'Fetches content from a specified URL' },
  { name: 'WebSearch', search: 'Allows Claude to search the web' },
  { name: 'TodoWrite', search: 'Use this tool to create and manage a structured task list' },
  { name: 'AskUserQuestion', search: 'Use this tool when you need to ask the user questions' },
];

for (const tool of tools) {
  const desc = extractToolDescription(tool.search);
  if (desc) {
    const cleanDesc = replaceVariables(desc);
    sections.push(`
## ${tool.name}
${cleanDesc.slice(0, 2000)}${cleanDesc.length > 2000 ? '\n[... truncated]' : ''}
`);
  }
}

// === DYNAMIC SECTIONS NOTE ===
sections.push(`
################################################################################
# DYNAMIC CONTENT (added at runtime)
################################################################################

The following are injected dynamically based on context:

- Environment info: working directory, platform, date, git status
- Model info: "You are powered by [model-name]"
- Allowed tools list (tools that don't require user approval)
- CLAUDE.md file contents (project instructions)
- MCP server instructions (if connected)
- Custom output styles (if configured)
`);

// Combine and clean up
let output = sections.join('\n');

// Remove duplicate consecutive newlines (more than 2)
output = output.replace(/\n{4,}/g, '\n\n\n');

// Replace known numeric values before catching remaining patterns
output = output.replace(/\$\{uzA\}/g, '2000');
output = output.replace(/\$\{EA6\}/g, '2000');
output = output.replace(/\$\{kj9\}/g, '600000');
output = output.replace(/\$\{[A-Za-z0-9_]+\}ms \/ \$\{[A-Za-z0-9_]+\} minutes/g, '600000ms / 10 minutes');
output = output.replace(/\$\{[A-Za-z0-9_]+\}ms \(\$\{[A-Za-z0-9_]+\} minutes\)/g, '120000ms (2 minutes)');
output = output.replace(/exceeds \$\{[A-Za-z0-9_]+\} characters/g, 'exceeds 30000 characters');

// Tool references in "NOT to use" section
output = output.replace(/use the \[DYNAMIC\] or \[DYNAMIC\] tool instead/g, 'use the Read or Glob tool instead');
output = output.replace(/use the \[DYNAMIC\] tool instead, to find/g, 'use the Glob tool instead, to find');
output = output.replace(/use the \[DYNAMIC\] tool instead of the Task/g, 'use the Read tool instead of the Task');

// Remove any remaining ${...} patterns we couldn't resolve
output = output.replace(/\$\{[^}]{1,50}\}/g, '[DYNAMIC]');

// Clean up conditional artifacts
output = output.replace(/\[DYNAMIC\]`?:"."\}/g, '');
output = output.replace(/\[DYNAMIC\]`?:""\}/g, '');
output = output.replace(/`:""}/g, '');
output = output.replace(/\?`\s*\n/g, '\n');

// Remove orphaned template artifacts
output = output.replace(/`\s*,\s*`/g, '\n');
output = output.replace(/^`|`$/gm, '');

// Clean up extra [DYNAMIC] markers followed by closing braces
output = output.replace(/\[DYNAMIC\]\}/g, '');

// Fix timeout patterns that became [DYNAMIC]
output = output.replace(/\[DYNAMIC\]ms \/ \[DYNAMIC\] minutes\)/g, '600000ms / 10 minutes)');
output = output.replace(/\[DYNAMIC\]ms \(\[DYNAMIC\] minutes\)/g, '120000ms (2 minutes)');
output = output.replace(/exceeds \[DYNAMIC\] characters/g, 'exceeds 30000 characters');
output = output.replace(/up to \[DYNAMIC\] lines/g, 'up to 2000 lines');
output = output.replace(/than \[DYNAMIC\] characters/g, 'than 2000 characters');

// Tool references that became [DYNAMIC]
output = output.replace(/use the \[DYNAMIC\] or \[DYNAMIC\] tool instead/g, 'use the Read or Glob tool instead');
output = output.replace(/use the \[DYNAMIC\] tool instead, to find/g, 'use the Glob tool instead, to find');
output = output.replace(/use the \[DYNAMIC\] tool instead of the Task/g, 'use the Read tool instead of the Task');

// Remove standalone [DYNAMIC] lines (empty dynamic content)
output = output.replace(/^\s*\[DYNAMIC\]\s*$/gm, '');
output = output.replace(/\n\s*\[DYNAMIC\]\s*\n/g, '\n');
output = output.replace(/\n   \[DYNAMIC\]\n/g, '\n');  // Indented version

// Write output
const outputPath = process.argv[2] || path.join(__dirname, 'system-prompt.txt');
fs.writeFileSync(outputPath, output);

const lineCount = output.split('\n').length;
console.log('Output:', outputPath);
console.log('Size:', output.length, 'chars');
console.log('Lines:', lineCount);
