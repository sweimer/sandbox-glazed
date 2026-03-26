#!/usr/bin/env node

/**
 * HUDX Vite React App Starter (MANUAL SCAFFOLD VERSION)
 * ---------------------------------------------------------
 * - Does NOT call Vite CLI at all
 * - Creates Vite-compatible project structure manually
 * - Installs dependencies manually
 * - Writes HUDX pages, router, and config reliably
 * - Copies fuse-module.js into each new app
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter your React app name (e.g. "Acme Calculator"): ', async (answer) => {
  rl.close();

  const folderName = answer
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');

  const appsRoot = path.join(__dirname, '..'); // /apps
  const appDir = path.join(appsRoot, folderName);

  if (fs.existsSync(appDir)) {
    console.error(`❌ App folder already exists: ${appDir}`);
    process.exit(1);
  }

  console.log(`\n📁 Creating manual Vite React app: ${appDir}`);
  fs.mkdirSync(appDir);

  // ---------------------------------------------------------
  // 1. Create folder structure
  // ---------------------------------------------------------
  const srcDir = path.join(appDir, 'src');
  const assetsDir = path.join(srcDir, 'assets');
  const pagesDir = path.join(srcDir, 'pages');

  fs.mkdirSync(srcDir);
  fs.mkdirSync(assetsDir);
  fs.mkdirSync(pagesDir);

  // ---------------------------------------------------------
  // 2. Write package.json
  // ---------------------------------------------------------
  console.log('📄 Writing package.json...');
  const pkg = {
    name: folderName,
    version: "0.0.0",
    private: true,
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview"
    },
    dependencies: {
      react: "^18.2.0",
      "react-dom": "^18.2.0",
      "react-router-dom": "^6.22.0"
    },
    devDependencies: {
      vite: "^5.2.0",
      "@vitejs/plugin-react": "^4.2.0"
    }
  };

  fs.writeFileSync(
    path.join(appDir, 'package.json'),
    JSON.stringify(pkg, null, 2)
  );

  // ---------------------------------------------------------
  // 3. Write index.html
  // ---------------------------------------------------------
  console.log('📄 Writing index.html...');
  fs.writeFileSync(
    path.join(appDir, 'index.html'),
    `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${folderName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`
  );

  // ---------------------------------------------------------
  // 4. Write vite.config.js
  // ---------------------------------------------------------
  console.log('🔧 Writing vite.config.js...');
  fs.writeFileSync(
    path.join(appDir, 'vite.config.js'),
    `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@hudx': path.resolve(__dirname, '../css'),
      '@hudxjs': path.resolve(__dirname, '../js'),
    },
  },
});
`
  );

  // ---------------------------------------------------------
  // 5. Write main.jsx
  // ---------------------------------------------------------
  console.log('📄 Writing main.jsx...');
  fs.writeFileSync(
    path.join(srcDir, 'main.jsx'),
    `
import '@hudx/hudx.css';
import '@hudxjs/hudx.js';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`
  );

  // ---------------------------------------------------------
  // 6. Write App.jsx (HUDX router)
  // ---------------------------------------------------------
  console.log('📄 Writing App.jsx...');
  fs.writeFileSync(
    path.join(srcDir, 'App.jsx'),
    `
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home.jsx';
import StyleGuide from './pages/StyleGuide.jsx';
import ApiReference from './pages/ApiReference.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: '1rem', background: '#eee' }}>
        <Link to="/">Home</Link> | <Link to="/styleguide">Style Guide</Link> | <Link to="/api">API Reference</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/styleguide" element={<StyleGuide />} />
        <Route path="/api" element={<ApiReference />} />
      </Routes>
    </BrowserRouter>
  );
}
`
  );

  // ---------------------------------------------------------
  // 7. Write HUDX pages
  // ---------------------------------------------------------
  console.log('📄 Writing HUDX pages...');

  fs.writeFileSync(
    path.join(pagesDir, 'Home.jsx'),
    `
export default function Home() {
  return <h1>Welcome to your HUDX React App</h1>;
}
`
  );

  fs.writeFileSync(
    path.join(pagesDir, 'StyleGuide.jsx'),
    `
import '@hudx/hudx.css';

export default function StyleGuide() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>HUDX Style Guide (POC)</h1>
      <button className="hudx-button">HUDX Button</button>
    </div>
  );
}
`
  );

  fs.writeFileSync(
    path.join(pagesDir, 'ApiReference.jsx'),
    `
import { useState } from 'react';

export default function ApiReference() {
  const [endpoint, setEndpoint] = useState('/node/article');
  const [response, setResponse] = useState(null);

  const apiBase = import.meta.env.VITE_DRUPAL_API;

  const testRequest = async () => {
    const res = await fetch(\`\${apiBase}\${endpoint}\`);
    const json = await res.json();
    setResponse(json);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>HUDX API Reference (POC)</h1>

      <p>Base URL: <code>{apiBase}</code></p>

      <select value={endpoint} onChange={(e) => setEndpoint(e.target.value)}>
        <option value="/node/article">Articles</option>
        <option value="/node/page">Pages</option>
        <option value="/taxonomy_term/tags">Tags</option>
      </select>

      <button onClick={testRequest} style={{ marginLeft: '1rem' }}>
        Test Request
      </button>

      <pre style={{ background: '#eee', padding: '1rem', marginTop: '1rem' }}>
        {response ? JSON.stringify(response, null, 2) : 'No response yet'}
      </pre>
    </div>
  );
}
`
  );

  // ---------------------------------------------------------
  // 8. Write .env
  // ---------------------------------------------------------
  console.log('🔧 Writing .env...');
  fs.writeFileSync(
    path.join(appDir, '.env'),
    `VITE_DRUPAL_API=http://sandbox.lndo.site/jsonapi`
  );
  console.log('  ✔ .env');

  // ---------------------------------------------------------
  // 9. Copy fuse-module.js into the new app
  // ---------------------------------------------------------
  console.log('📄 Copying fuse-module.js into the app...');

  const moduleGeneratorSrc = path.join(
    __dirname,
    'react',
    'fuse-module.js'
  );

  const moduleGeneratorDest = path.join(
    appDir,
    'fuse-module.js'
  );

  fs.copyFileSync(moduleGeneratorSrc, moduleGeneratorDest);
  console.log('  ✔ fuse-module.js copied');

  // ---------------------------------------------------------
  // 10. Install dependencies
  // ---------------------------------------------------------
  console.log('\n📦 Installing dependencies...');
  execSync('npm install', { cwd: appDir, stdio: 'inherit' });

  console.log('\n🔥 Manual Vite + HUDX React app created successfully!');
  console.log(`📍 Location: ${appDir}`);
  console.log(`👉 Run: cd ${folderName} && npm run dev\n`);
});
