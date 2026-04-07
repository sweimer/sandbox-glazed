import React, { useState } from "react";

// Demo: change this to '#ff0000' to show AI-assisted color changes
const CARD_12_BORDER_COLOR = '#b7410e';

export default function ThreePDLandingPage() {
  const [showProCodeRepos, setShowProCodeRepos] = useState(false);

  return (
    <div className="container my-5">

      {/* HERO SECTION WITH DXPR ANIMATION */}
      <header
        className="mb-5 position-relative text-white rounded shadow dxpr-animate dxpr-fade-up"
        style={{
          backgroundImage:
            "url('https://oakwoodhomesco.com/wp-content/uploads/2022/02/new-home-builders-giving-back-hero-image.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "360px",
          overflow: "hidden",
        }}
      >
        {/* Left Overlay */}
        <div
          className="position-absolute top-0 start-0 h-100 d-flex flex-column justify-content-center p-4 p-md-5"
          style={{
            width: "60%",
            background:
              "linear-gradient(to right, rgba(0,0,0,0.65), rgba(0,0,0,0.45), rgba(0,0,0,0))",
          }}
        >
          <h1 className="display-5 fw-bold">
            <i className="bi bi-house me-2 text-warning" aria-hidden="true"></i>
            HUDx 3PD Depot
          </h1>

          <p className="lead mt-2">
            Your one‑stop shop for building HUDX web development solutions — from content editing to full application development.
          </p>

          <div className="mt-4">
            <a
              href="/hudx-test/3pd-ai-director"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ready to build? Start with the 3PD Director (opens in new tab)"
              className="btn btn-warning btn-lg fw-bold shadow"
            >
              <i className="bi bi-stars me-2" aria-hidden="true"></i>
              Ready to build? Start with the 3PD Director →
            </a>
          </div>
        </div>
      </header>

      {/* BROWSE DIVIDER */}
      <div className="text-center my-4 dxpr-animate dxpr-fade-in">
        <div className="text-primary fw-bold">
          <i className="bi bi-grid me-2" aria-hidden="true"></i>
          Browse by Path
        </div>
      </div>

      {/* CARD GROUP 1 */}
      <h2 className="h5 fw-semibold text-muted mb-3">For Static Features and Apps Built in Drupal</h2>
      <div className="row g-4 mb-5">

        {/* 3PD CONTENT EDITORS */}
        <div className="col-6">
          <div className="card h-100 shadow-sm dxpr-animate dxpr-fade-in dxpr-delay-1" style={{ borderColor: CARD_12_BORDER_COLOR, borderWidth: '2px' }}>
            <div className="card-body d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-pencil text-primary me-3" style={{ fontSize: "2rem" }} aria-hidden="true"></i>
                <h3 className="h3 mb-0">3PD Content Editors <br/>(No Code)</h3>
              </div>
              <p className="card-text text-muted mb-2">
                Build and assemble pages directly inside Drupal using Layout Builder and HUDX SDC components.
              </p>
              <p className="small text-muted mb-1">Examples:</p>
              <ul className="list-unstyled small mb-3">
                <li><a href="https://admin.dev.hudx.info/" target="_blank" rel="noopener noreferrer" aria-label="HUDX Home (opens in new tab)" className="link-primary">HUDX Home</a></li>
                <li><a href="https://admin.dev.hudx.info/programs/public-housing/mainstream-vouchers" target="_blank" rel="noopener noreferrer" aria-label="Mainstream Vouchers (opens in new tab)" className="link-primary">Mainstream Vouchers</a></li>
              </ul>
              <a href="/node/add/basic_page_layout_builder" target="_blank" rel="noopener noreferrer" aria-label="Create Layout Builder Page (opens in new tab)" className="btn btn-primary mt-auto">
                Create Layout Builder Page
              </a>
            </div>
          </div>
        </div>

        {/* 3PD PAGE BUILDERS */}
        <div className="col-6">
          <div className="card h-100 shadow-sm dxpr-animate dxpr-fade-in dxpr-delay-2" style={{ borderColor: CARD_12_BORDER_COLOR, borderWidth: '2px' }}>
            <div className="card-body d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-brush text-primary me-3" style={{ fontSize: "2rem" }} aria-hidden="true"></i>
                <h3 className="h3 mb-0">3PD Page Builders <br/>(Low Code)</h3>
              </div>
              <p className="card-text text-muted mb-4">
                Drag‑and‑drop React builder with AI assistance for creating more advanced HUDX features.
              </p>
              <p className="small text-muted mb-1">Examples:</p>
              <ul className="list-unstyled small mb-3">
                <li><a href="https://dev-3-pd-ide.pantheonsite.io/about" target="_blank" rel="noopener noreferrer" aria-label="3PD IDE — About Page (opens in new tab)" className="link-primary">3PD IDE — About Page</a></li>
                <li><a href="/node/17" target="_blank" rel="noopener noreferrer" aria-label="Three Cards (opens in new tab)" className="link-primary">Three Cards</a></li>
                <li><a href="/node/16" target="_blank" rel="noopener noreferrer" aria-label="David Bowie (opens in new tab)" className="link-primary">David Bowie</a></li>
              </ul>
              <a href="/hudx-test/3pd-ai-coder" target="_blank" rel="noopener noreferrer" aria-label="3PD AI Code Helper (opens in new tab)" className="btn btn-primary">
                3PD AI Code Helper
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* CARD GROUP 2 */}
      <h2 className="h5 fw-semibold text-muted mb-3">For Dynamic Features and Apps Built with Code</h2>
      <div className="row g-4 mb-5">

        {/* 3PD IDE STARTERS */}
        <div className="col-6">
          <div className="card h-100 shadow-sm dxpr-animate dxpr-fade-in dxpr-delay-3" style={{ borderColor: '#228B22', borderWidth: '2px' }}>
            <div className="card-body d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-tools text-primary me-3" style={{ fontSize: "2rem" }} aria-hidden="true"></i>
                <h3 className="h3 mb-0">3PD IDE Starters <br/>(Pro Code)</h3>
              </div>
              <p className="card-text text-muted mb-3">
                Clone a 3PD IDE starter kit and build full‑featured HUDX applications using your preferred framework.
              </p>
              <p className="small text-muted mb-1">Examples:</p>
              <ul className="list-unstyled small mb-3">
                <li><a href="https://dev-3-pd-ide.pantheonsite.io/node/11" target="_blank" rel="noopener noreferrer" aria-label="STraCAT (opens in new tab)" className="link-primary">STraCAT</a></li>
              </ul>
              <button
                type="button"
                className="btn btn-secondary mt-auto"
                aria-expanded={showProCodeRepos}
                onClick={() => setShowProCodeRepos(!showProCodeRepos)}
              >
                {showProCodeRepos ? "Hide Starter Kits" : "View Starter Kits"}
              </button>

              {showProCodeRepos && (
                <ul className="list-unstyled small mt-2 mb-0">
                  {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                  <li><a href="#" className="link-success">Angular Starter Kit</a></li>
                  <li><a href="https://github.com/sweimer/3PD---Astro-Static-Starter-Kit" target="_blank" rel="noopener noreferrer" aria-label="Astro-Static Starter Kit (opens in new tab)" className="link-success">Astro-Static Starter Kit</a></li>
                  <li><a href="https://github.com/sweimer/3PD---Astro-Forms-Starter-Kit" target="_blank" rel="noopener noreferrer" aria-label="Astro-Form Starter Kit (opens in new tab)" className="link-success">Astro-Form Starter Kit</a></li>
                  <li><a href="https://github.com/sweimer/3PD---React-Starter-Kit" target="_blank" rel="noopener noreferrer" aria-label="React Starter Kit (opens in new tab)" className="link-success">React Starter Kit</a></li>
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* 3PD STAND-ALONE EMBEDS + PROPERTIES */}
        <div className="col-6">
          <div className="card h-100 shadow-sm dxpr-animate dxpr-fade-in dxpr-delay-4" style={{ borderColor: '#228B22', borderWidth: '2px' }}>
            <div className="card-body d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-wrench-adjustable text-primary me-3" style={{ fontSize: "2rem" }} aria-hidden="true"></i>
                <h3 className="h3 mb-0">3PD Stand‑Alone/ <br/>Smart Embeds</h3>
              </div>
              <p className="card-text text-muted mb-4">
                Submit external tools (Tableau, Salesforce, legacy apps) for Smart Embed integration, or standalone sites for linking consideration within HUDX.
              </p>
              <p className="small text-muted mb-1">Examples:</p>
              <ul className="list-unstyled small mb-3">
                <li><a href="/hudx-test/embed---sc-training" target="_blank" rel="noopener noreferrer" aria-label="HUD Service Coordinators (opens in new tab)" className="link-primary">HUD Service Coordinators</a></li>
                <li><a href="/hudx-test/embed---pha-financial-management" target="_blank" rel="noopener noreferrer" aria-label="PHA Financial Mgt (opens in new tab)" className="link-primary">PHA Financial Mgt</a></li>
              </ul>
              <a href="/hudx-test/react---3pd-embed-request" target="_blank" rel="noopener noreferrer" aria-label="Submit Integration Request (opens in new tab)" className="btn btn-primary mt-auto">
                Submit Integration Request
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* CARD GROUP 3 */}
      <h2 className="h5 fw-semibold text-muted mb-3">Tools &amp; Management</h2>
      <div className="row g-4">

        {/* 3PD DESIGN SYSTEM */}
        <div className="col-6">
          <div className="card h-100 shadow-sm dxpr-animate dxpr-fade-in dxpr-delay-5" style={{ borderColor: '#FFD700', borderWidth: '2px' }}>
            <div className="card-body d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-palette text-primary me-3" style={{ fontSize: "2rem" }} aria-hidden="true"></i>
                <h3 className="h3 mb-0">3PD Design System</h3>
              </div>
              <p className="card-text text-muted mb-4">
                Components, tokens, and patterns for building HUDX-consistent interfaces. Reference before building any 3PD application. This design system is shared across all 3PD starter kits and shipped to 3PDs automatically.
              </p>
              <a href="https://trussworks.github.io/react-uswds/?path=/docs/components-accordion--docs" target="_blank" rel="noopener noreferrer" aria-label="Storybook (opens in new tab)" className="btn btn-primary mt-auto">
                Storybook
              </a>
            </div>
          </div>
        </div>

        {/* 3PD MODULE MANAGER */}
        <div className="col-6">
          <div className="card h-100 shadow-sm dxpr-animate dxpr-fade-in dxpr-delay-6" style={{ borderColor: '#FFD700', borderWidth: '2px' }}>
            <div className="card-body d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-house-heart text-primary me-3" style={{ fontSize: "2rem" }} aria-hidden="true"></i>
                <h3 className="h3 mb-0">3PD Module Manager</h3>
              </div>
              <p className="card-text text-muted mb-4">
                Review and manage content submitted by third-party developers across all active 3PD modules.
              </p>
              <a href="/hudx-test/astro-forms---3pd-checklist" target="_blank" rel="noopener noreferrer" aria-label="Manage 3PD Modules (opens in new tab)" className="btn btn-primary mt-auto">
                Manage 3PD Modules
              </a><br/>
              <a href="/admin/content" target="_blank" rel="noopener noreferrer" aria-label="Content Manager (opens in new tab)" className="btn btn-primary mt-auto">
                Content Manager
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <div className="text-center mt-5 dxpr-animate dxpr-fade-in">
        <small className="text-muted">
          <i className="fa-solid fa-house-chimney me-2" aria-hidden="true"></i>
          HUDX • 3PD Depot
        </small>
      </div>
    </div>
  );
}
