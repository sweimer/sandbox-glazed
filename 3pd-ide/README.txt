# 🧭 3PD IDE Command Glossary (Quick Reference)

A complete, chronological list of every command a developer will use inside the 3PD IDE — whether they are a **third‑party contributor** or an **internal HUDX engineer**.

### **Create a new React app**
```
3pd react app <name>
```

### **Enter the app**
```
cd apps/<name>
```

### **Run the dev server**
```
npm run dev
```

### **Build the React app**
```
npm run build
```

### **Generate a Drupal module (3PD mode)**
```
3pd react module
```

### **Generate AND install the module (internal HUDX mode)**
```
3pd react module --install
```

### **List all apps and modules**
```
3pd list
```

### **Run environment diagnostics**
```
3pd doctor
```

---

# 📘 3PD IDE Overview

The 3PD IDE is a self‑contained development environment that allows third‑party developers to build HUDX‑compatible React applications without requiring access to HUDX’s internal Drupal instance. Internal HUDX engineers can use the same tools with elevated capabilities.

The IDE provides:

- React app scaffolding
- Automated Drupal module generation
- DXPR‑safe mounting
- MemoryRouter enforcement
- Vite build integration
- Optional Drupal installation (internal only)
- A unified CLI (`3pd`)

---

# 🧩 React Workflow

## **1. Create a new app**
```
3pd react app my-app
```

This scaffolds a fully configured React application inside:

```
/3pd-ide/apps/my-app
```

## **2. Develop locally**
```
cd apps/my-app
npm run dev
```

## **3. Build for production**
```
npm run build
```

---

# 🏗️ Module Generation Workflow

## **3PD Developers (default mode)**

```
3pd react module
```

This will:

- build the React app
- generate a Drupal module
- place it inside the app folder
- stop

3PD developers **do not install modules** — they commit the generated module to their feature branch.

---

## **Internal HUDX Developers (install mode)**

```
3pd react module --install
```

This will:

- build the React app
- generate the module
- detect the Drupal root
- copy the module into `/web/modules/custom`
- enable it via Drush
- clear caches

This is the full internal workflow.

---

# 🧪 Diagnostics

Run environment checks:

```
3pd doctor
```

This validates:

- Node version
- NPM version
- Vite availability
- File system permissions
- Internal vs 3PD mode detection
- Drupal root detection (internal only)

---

# 📂 Directory Structure

```
3pd-ide/
  apps/
    react-app-01/
    react-app-02/
  starter-scripts/
    cli/
      index.js
      commands/
        react-app.js
        fuse-module.js
    shared/
      log.js
  global/
    assets/
    utilities/
```

---

# 🎯 Next Steps

- 3PD developers commit the generated module.
- Internal HUDX developers install and test modules locally.
- Both workflows use the same CLI, with different capabilities.
