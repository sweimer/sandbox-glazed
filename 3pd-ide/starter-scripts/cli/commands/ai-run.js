/**
 * 3pd run ai
 *
 * Launches Claude Code as an AI dev assistant inside the current app directory.
 * Generates CLAUDE.md from:
 *   - PROMPT.txt  (starter kit identity — static, committed)
 *   - .ai/LOG.md  (project memory — dynamic, committed)
 * Starts the dev server automatically (npm run dev) if not already running.
 * Kills the dev server when the Claude session ends.
 *
 * CLAUDE.md is gitignored — session artifact, never committed.
 * .ai/LOG.md is committed — persists project memory across developers and sessions.
 */

import fs from 'fs';
import net from 'net';
import path from 'path';
import { execSync, spawn } from 'child_process';
import chalk from 'chalk';
import { log } from '../shared/log.js';

const VITE_PORT   = 5173;
const SERVER_PORT = 4000;

// ------------------------------------------------------------
// Port utilities
// ------------------------------------------------------------
function isPortInUse(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(true))
      .once('listening', () => tester.close(() => resolve(false)))
      .listen(port, '127.0.0.1');
  });
}

function waitForPort(port, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const start    = Date.now();
    const interval = setInterval(async () => {
      if (await isPortInUse(port)) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        reject(new Error(`Timed out waiting for port ${port}`));
      }
    }, 300);
  });
}

async function isHttpReady(url, timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await fetch(url);
      return true;
    } catch {}
    await new Promise(r => setTimeout(r, 300));
  }
  return false;
}

// ------------------------------------------------------------
// Behavioral instructions block — baked into every CLAUDE.md
// ------------------------------------------------------------
const BEHAVIORAL_INSTRUCTIONS = `
## YOUR ROLE

You are the embedded AI development assistant for this HUDX React starter kit project.
Behave like a senior engineer who knows this codebase intimately, tracks its progress,
and helps the developer move forward efficiently and confidently.

You have two sources of truth above:
  1. STARTER KIT IDENTITY (PROMPT.txt) — the architecture, conventions, and rules.
     Treat this as law. Do not suggest approaches that contradict it.
  2. PROJECT MEMORY (.ai/LOG.md) — the current status, roadmap, and session history.
     Read it carefully before responding. This is how you know where things stand.

## SESSION STARTUP — do this every time

1. Briefly confirm you have loaded the project context.
2. Give a 2–3 sentence summary of where the project stands based on the LOG.
3. Call out the top 2–3 next steps or open roadmap items.
4. If the dev server is running, mention the URL so the developer can open it alongside
   this conversation.
5. Ask what the developer wants to work on today.

Keep it short. The developer wants to get to work, not read a report.

## DURING THE SESSION

- Follow the architecture and conventions in PROMPT.txt, especially the mandatory checklist.
- Enforce naming conventions: machine names, route namespacing, APP_SLUG pattern.
- When a question has a documented answer in PROMPT.txt, cite it rather than improvising.
- If unresolved questions come up, add them to the Open Questions section of .ai/LOG.md.
- When scaffolding code, follow the patterns already established in the starter kit.
- Never suggest libraries, patterns, or approaches not already in use unless the developer
  explicitly asks to evaluate alternatives.
- When discussing UI changes, refer the developer to the running app URL to verify visually.
- End every reply with the session footer defined in the SESSION FOOTER section below.
  Never omit it. Never modify it.

## SESSION WRAP-UP

When the developer types "Close Session" (the canonical close phrase):

1. Ask if there is anything else before closing out.
2. Run: git status --short
   Note any uncommitted changes in the Session History entry so the next developer
   knows what was left in-flight. Example: "Left with 3 modified files (src/pages/Home.jsx,
   server/routes/submissions.js, .ai/LOG.md) — run git status to review."
   If the working tree is clean, note that too.
3. Update .ai/LOG.md:
   - Add a dated entry to Session History describing what was accomplished,
     including the uncommitted files noted above.
   - Update Current Status to reflect where things stand now.
   - Update Roadmap: check off completed items, add new ones, reprioritize if needed.
   - Update Open Questions and Backlog if anything changed.
4. Confirm the LOG has been updated.

Never skip the LOG update. It is how the next developer — or your next session —
picks up exactly where this one left off.
`.trim();

// ------------------------------------------------------------
// LOG template for new apps (first run only)
// ------------------------------------------------------------
function buildLogTemplate(appName, date) {
  return `# Project LOG — ${appName}

Framework: React + Vite + Express + SQLite
Created: ${date}

---

## Current Status

App scaffolded. First session not yet started.

---

## Roadmap

1. [ ] Define the app's purpose and data model
2. [ ] Build out the UI in src/pages/Home.jsx
3. [ ] Customize Express routes in server/routes/submissions.js if needed
4. [ ] Run \`3pd react module\` to package for Drupal

---

## Open Questions

- What is this app's purpose?
- What data does it need to store or display?
- Will the submissions table schema need customization?

---

## Backlog

(add lower-priority items here)

---

## Session History

(sessions will be logged here by your AI assistant)
`.trim();
}

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------
export default async function runAi({ ideRoot, validate = false }) {
  const cwd = process.cwd();

  // 1. Check claude CLI is installed
  try {
    execSync('which claude', { stdio: 'pipe' });
  } catch {
    log.error('Claude Code CLI not found.');
    console.log('');
    console.log('  Install it at:  https://claude.ai/code');
    console.log('  Then run:       3pd run ai');
    console.log('');
    process.exit(1);
  }

  // 2. Find PROMPT.txt
  //    Priority: local app PROMPT.txt → React starter PROMPT.txt
  const localPromptPath   = path.join(cwd, 'PROMPT.txt');
  const starterPromptPath = path.join(ideRoot, 'apps', '0.starter-react', 'PROMPT.txt');
  const promptPath = fs.existsSync(localPromptPath) ? localPromptPath : starterPromptPath;

  if (!fs.existsSync(promptPath)) {
    log.error('PROMPT.txt not found.');
    log.info('Run this command from inside an app directory (e.g. apps/react---my-app).');
    process.exit(1);
  }

  const promptContent = fs.readFileSync(promptPath, 'utf8');

  // 3. Find or create .ai/LOG.md
  const aiDir  = path.join(cwd, '.ai');
  const logPath = path.join(aiDir, 'LOG.md');

  if (!fs.existsSync(aiDir)) fs.mkdirSync(aiDir, { recursive: true });

  let isFirstRun = false;

  if (!fs.existsSync(logPath)) {
    isFirstRun = true;
    const appName = path.basename(cwd);
    const date    = new Date().toISOString().split('T')[0];
    fs.writeFileSync(logPath, buildLogTemplate(appName, date), 'utf8');
    console.log('');
    log.success('Created .ai/LOG.md — your project memory file.');
    log.info('Commit this file so the next developer picks up where you left off.');
    console.log('');
  }

  const logContent = fs.readFileSync(logPath, 'utf8');

  // 4. Start dev server if not already running
  let devProcess    = null;
  let devServerUrl  = null;
  const alreadyRunning = await isPortInUse(VITE_PORT);

  if (alreadyRunning) {
    const httpOk = await isHttpReady(`http://localhost:${VITE_PORT}`, 2000);
    if (httpOk) {
      devServerUrl = `http://localhost:${VITE_PORT}`;
      log.info(`Dev server already running → ${devServerUrl}`);
    } else {
      log.warn(`Port ${VITE_PORT} is in use but not responding. Check your dev server.`);
    }
  } else {
    const hasPackageJson = fs.existsSync(path.join(cwd, 'package.json'));
    if (hasPackageJson) {
      console.log('');
      console.log('  ┌─────────────────────────────────────────────────────┐');
      console.log('  │  Starting your dev environment (npm run dev)        │');
      console.log('  │                                                     │');
      console.log('  │  This starts two servers:                           │');
      console.log('  │    • React (Vite)   → http://localhost:5173         │');
      console.log('  │    • Express API    → http://127.0.0.1:4000         │');
      console.log('  │                                                     │');
      console.log('  │  This may take a minute on first run.               │');
      console.log('  │  Your AI assistant will open automatically when     │');
      console.log('  │  the dev environment is ready.                      │');
      console.log('  └─────────────────────────────────────────────────────┘');
      console.log('');
      process.stdout.write('  Waiting for dev server');

      devProcess = spawn('npm', ['run', 'dev'], {
        cwd,
        stdio: 'ignore',
        detached: false,
      });

      devProcess.on('error', () => {
        // Non-fatal — Claude still launches, dev starts the server manually
        console.log('');
        log.warn('Dev server failed to start. Run npm run dev manually.');
        devProcess = null;
      });

      try {
        const dotInterval = setInterval(() => process.stdout.write('.'), 600);
        await waitForPort(VITE_PORT, 20000);
        clearInterval(dotInterval);

        // TCP port is bound — verify Vite is actually serving HTTP
        const httpOk = await isHttpReady(`http://localhost:${VITE_PORT}`);
        if (httpOk) {
          console.log(' ready');
          console.log('');
          devServerUrl = `http://localhost:${VITE_PORT}`;
          log.success(`App running at ${devServerUrl}`);
        } else {
          console.log(' failed');
          console.log('');
          log.warn('Dev server started but is not responding — it may have crashed.');
          log.info('Check for errors by running: npm run dev');
          log.info('Your AI session will still open. Start the server manually if needed.');
          if (devProcess) { devProcess.kill(); devProcess = null; }
        }
      } catch {
        console.log('');
        log.warn('Dev server did not start within 20s. Run npm run dev manually.');
        if (devProcess) { devProcess.kill(); devProcess = null; }
      }
    }
  }

  console.log('');

  // 5. Build CLAUDE.md
  const validateBlock = validate ? `
## VALIDATE ON CLOSE

The developer launched with --validate. When they type "Close Session":
1. Run \`3pd validate\` before updating the LOG.
2. Include a summary of the results (lint, security scan, a11y, tests) in the
   Session History entry. Note any failures the next developer should address.
3. Then proceed with the standard Close Session steps.
` : '';

  const devServerBlock = devServerUrl
    ? `\n## DEV SERVER\n\nThe app is running at **${devServerUrl}** (React UI).\nThe API is running at **http://127.0.0.1:${SERVER_PORT}** (Express).\nReference these URLs when discussing UI or API changes.\n`
    : '';

  const firstRunNote = isFirstRun ? `
> **FIRST RUN — SCAN REQUIRED**
> No LOG history exists yet. Before presenting any summary or asking any questions:
>
> 1. Read these files to assess what has already been built:
>    - package.json (app name, dependencies)
>    - src/App.jsx and src/pages/*.jsx (what UI and routes exist)
>    - server/db/schema.sql (what data model is defined)
>    - server/routes/*.js (what API endpoints exist)
>    - README.md if present
>
> 2. Make a judgment:
>    - If the app is a CLEAN SCAFFOLD (no custom code beyond the starter template default):
>      Start with onboarding. Introduce yourself briefly, explain how the dev workflow
>      works, and ask what the developer wants to build.
>    - If the app has REAL CODE beyond the template (custom UI, schema, routes, etc.):
>      Populate .ai/LOG.md with your observations before presenting anything:
>        - Current Status: what the app does, how far along it is
>        - Roadmap: what appears to still be needed based on the code
>        - Open Questions: anything ambiguous or undocumented in the code
>      Then present a 2–3 sentence summary of what you found and ask what to work on.
>
> Do not skip the scan. A wrong summary is worse than a slow start.
` : '';

  const appLine = devServerUrl
    ? `  ▎ App: ${devServerUrl}\n`
    : '';

  const sessionFooterBlock = `
## SESSION FOOTER

Append the following block verbatim at the end of every reply, without exception:

${appLine}  ▎ Type **Close Session** when you're done and I'll update the LOG with today's progress.
  ▎ Tip: Ask me to run \`3pd lint\`, \`3pd scan\`, \`3pd a11y\`, or \`3pd validate\` at any time.
  ▎ Tip: Ask me to run \`3pd react module\` or \`3pd react module --install\` when you're ready to turn this app into a Drupal Module.
`;

  const claudeMd = `# HUDX React Starter Kit — AI Dev Assistant Context

<!-- Auto-generated by \`3pd run ai\`. Do not edit or commit. -->
<!-- Regenerated each session from PROMPT.txt + .ai/LOG.md.  -->
${firstRunNote}${validateBlock}${devServerBlock}
---

## STARTER KIT IDENTITY

The following is PROMPT.txt for this starter kit.
It defines the architecture, conventions, mandatory checklist, and known issues.
Treat it as law.

${promptContent}

---

## PROJECT MEMORY

The following is .ai/LOG.md — the persistent project history, roadmap, and session log.
Read it carefully before responding to the developer.

${logContent}

---

## BEHAVIORAL INSTRUCTIONS

${BEHAVIORAL_INSTRUCTIONS}
${sessionFooterBlock}`.trim();

  // 6. Write CLAUDE.md (session artifact — gitignored)
  const claudeMdPath = path.join(cwd, 'CLAUDE.md');
  fs.writeFileSync(claudeMdPath, claudeMd, 'utf8');

  // 7. Ensure CLAUDE.md is in .gitignore
  const gitignorePath = path.join(cwd, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gi = fs.readFileSync(gitignorePath, 'utf8');
    if (!gi.includes('CLAUDE.md')) {
      fs.appendFileSync(
        gitignorePath,
        '\n# AI assistant session context (auto-generated, never commit)\nCLAUDE.md\n'
      );
    }
  }

  // 8. Launch claude
  log.info('Starting AI dev assistant...');
  log.info(`Loaded: ${path.relative(cwd, promptPath)}  +  .ai/LOG.md`);
  console.log('');
  console.log(chalk.bgYellow.black.bold('  Type "Close Session" when done — Claude will update the LOG with today\'s progress.  '));
  console.log('');

  const child = spawn('claude', ['Begin session.'], { stdio: 'inherit', cwd });

  child.on('error', (err) => {
    if (devProcess) devProcess.kill();
    if (err.code === 'ENOENT') {
      log.error('claude command not found. Install Claude Code: https://claude.ai/code');
    } else {
      log.error(`Failed to start Claude: ${err.message}`);
    }
    process.exit(1);
  });

  child.on('exit', (code) => {
    if (devProcess) {
      devProcess.kill();
      console.log('');
      log.info('Dev server stopped. To restart: npm run dev');
    }
    process.exit(code ?? 0);
  });

  // Clean up dev server on unexpected termination
  process.on('SIGINT',  () => { if (devProcess) devProcess.kill(); process.exit(0); });
  process.on('SIGTERM', () => { if (devProcess) devProcess.kill(); process.exit(0); });
}
