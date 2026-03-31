#!/usr/bin/env node

/**
 * inject-and-sync-s3.js
 *
 * 1. Injects hudx-resize.js into every .html file in a local source directory
 * 2. Syncs the injected files to an S3 path via AWS CLI
 *
 * Usage:
 *   node inject-and-sync-s3.js <localDir> <s3Path>
 *
 * Example:
 *   node inject-and-sync-s3.js \
 *     ../smart-embeds/sc-training \
 *     s3://sites.hudexchange.info/trainings-poc/trainings/service-coordinators-in-multifamily-housing-online-learning-tool
 *
 * Prerequisites:
 *   - AWS CLI installed and configured (aws configure or env vars)
 *   - Local source dir contains the static app files
 *   - Run from 3pd-ide/scripts/ or adjust paths accordingly
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const [,, localDir, s3Path] = process.argv;

if (!localDir || !s3Path) {
  console.error('Usage: node inject-and-sync-s3.js <localDir> <s3Path>');
  console.error('Example:');
  console.error('  node inject-and-sync-s3.js \\');
  console.error('    ../smart-embeds/sc-training \\');
  console.error('    s3://sites.hudexchange.info/trainings-poc/trainings/service-coordinators-in-multifamily-housing-online-learning-tool');
  process.exit(1);
}

const resolvedDir = path.resolve(__dirname, localDir);

if (!fs.existsSync(resolvedDir)) {
  console.error(`❌  Local directory not found: ${resolvedDir}`);
  process.exit(1);
}

const snippetSrc = path.resolve(__dirname, '../apps/0.starter-smart-embed/snippet/hudx-resize.js');

if (!fs.existsSync(snippetSrc)) {
  console.error(`❌  hudx-resize.js not found at: ${snippetSrc}`);
  process.exit(1);
}

// ---------------------------------------------------------
// Step 1: Copy hudx-resize.js into the source directory
// ---------------------------------------------------------
const snippetDest = path.join(resolvedDir, 'hudx-resize.js');
fs.copyFileSync(snippetSrc, snippetDest);
console.log(`✅  hudx-resize.js copied → ${snippetDest}`);

// ---------------------------------------------------------
// Step 2: Inject <script> tag into every .html file
// ---------------------------------------------------------
function walkHtml(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files = files.concat(walkHtml(full));
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

const htmlFiles = walkHtml(resolvedDir);
let injected = 0;
let alreadyHad = 0;

for (const filePath of htmlFiles) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('hudx-resize.js')) {
    alreadyHad++;
    continue;
  }
  const replaced = content.replace(
    /<\/body>/i,
    '<script src="hudx-resize.js"></script>\n</body>'
  );
  if (replaced !== content) {
    fs.writeFileSync(filePath, replaced, 'utf8');
    injected++;
  }
}

console.log(`✅  Injected hudx-resize.js into ${injected} HTML files (${alreadyHad} already had it).`);

// ---------------------------------------------------------
// Step 3: Sync to S3
// ---------------------------------------------------------
console.log(`\n🚀  Syncing to ${s3Path} ...\n`);

try {
  execSync(
    `aws s3 sync "${resolvedDir}" "${s3Path}" --delete`,
    { stdio: 'inherit' }
  );
  console.log('\n✅  S3 sync complete.');
} catch (err) {
  console.error('\n❌  S3 sync failed. Check AWS CLI credentials and bucket permissions.');
  process.exit(1);
}

console.log(`
Done. Next steps:
  1. Wait ~30s for CloudFront to serve updated files (or invalidate the distribution)
  2. Test the iframe resize at your Drupal test route
  3. If CloudFront is caching stale files, create an invalidation:
       aws cloudfront create-invalidation --distribution-id E34CQM3GCYZN5R --paths "/*"
`);