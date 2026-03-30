import React, { useState } from "react";

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

            <i className="bi bi-house me-2 text-warning"></i>
            HUDx 3PD Depot
          </h1>

          <p className="lead mt-2">
            Your one‑stop shop for building HUDX web development solutions — from content editing to full application development.
          </p>
        </div>
      </header>

      {/* BLUEPRINT DIVIDER */}
      <div className="text-center my-4 dxpr-animate dxpr-fade-in">
        <div className="text-primary fw-bold">
          <i className="bi bi-gear me-2"></i>
          Choose Your Build Path
        </div>
      </div>

      {/* CARD GRID */}
      <div className="row g-4">

        {/* 3PD CONTENT EDITORS */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 border-primary shadow-sm dxpr-animate dxpr-fade-in dxpr-delay-1">
            <div className="card-body d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-pencil text-primary me-3" style={{ fontSize: "2rem" }}></i>
                <h2 className="h3 mb-0">3PD Content Editors <br/>(No Code)</h2>
              </div>
              <p className="card-text text-muted mb-4">
                Build and assemble pages directly inside Drupal using Layout Builder and HUDX SDC components.
              </p>
              <a href="/node/add/basic_page_layout_builder" target="_blank" className="btn btn-primary mt-auto">
                Create Layout Builder Page
              </a>
            </div>
          </div>
        </div>

        {/* 3PD PAGE BUILDERS */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 border-info shadow-sm dxpr-animate dxpr-fade-in dxpr-delay-2">
            <div className="card-body d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-brush text-primary me-3" style={{ fontSize: "2rem" }}></i>
                <h2 className="h3 mb-0">3PD Page Builders <br/>(Low Code)</h2>
              </div>
              <p className="card-text text-muted mb-4">
                Drag‑and‑drop React builder with AI assistance for creating more advanced HUDX features.
              </p>
              <a href="/3pd/ai-helper" target="_blank" className="btn btn-primary">
                Option 1 - 3PD AI Helper
              </a>
            <br/>
              <a href="/node/add/basic_page_layout_builder" target="_blank" className="btn btn-primary">
                Option 2 - COMING SOON
              </a>
            </div>
          </div>
        </div>

        {/* 3PD IDE STARTERS */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 border-success shadow-sm dxpr-animate dxpr-fade-in dxpr-delay-3">
            <div className="card-body d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-tools text-primary me-3" style={{ fontSize: "2rem" }}></i>
                <h2 className="h3 mb-0">3PD IDE Starters <br/>(Pro Code)</h2>
              </div>
              <p className="card-text text-muted mb-3">
                Clone a 3PD IDE starter kit and build full‑featured HUDX applications using your preferred framework.
              </p>

              <button
                type="button"
                className="btn btn-secondary mt-auto"
                onClick={() => setShowProCodeRepos(!showProCodeRepos)}
              >
                {showProCodeRepos ? "Hide Starter Kits" : "View Starter Kits"}
              </button>

              {showProCodeRepos && (
                <ul className="list-unstyled small mt-2 mb-0">
                  <li><a href="#" target="_blank" className="link-success">Angular Starter Kit</a></li>
                  <li><a href="https://github.com/sweimer/3PD---Astro-Static-Starter-Kit" target="_blank" className="link-success">Astro-Static Starter Kit</a></li>
                  <li><a href="https://github.com/sweimer/3PD---Astro-Forms-Starter-Kit" target="_blank" className="link-success">Astro-Form Starter Kit</a></li>
                  <li><a href="https://github.com/sweimer/3PD---React-Starter-Kit" target="_blank" className="link-success">React Starter Kit</a></li>
                  <li><a href="#" target="_blank" className="link-success">VanillaJS Starter Kit</a></li>
                  <li><a href="#" target="_blank" className="link-success">Drupal Module Starter Kit</a></li>
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* 3PD STAND-ALONE EMBEDS + PROPERTIES */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 border-warning shadow-sm dxpr-animate dxpr-fade-in dxpr-delay-4">
            <div className="card-body d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-wrench-adjustable text-primary me-3" style={{ fontSize: "2rem" }}></i>
                <h2 className="h3 mb-0">3PD Stand‑Alone/ <br/>Smart Embeds</h2>
              </div>
              <p className="card-text text-muted mb-4">
                Submit external tools (Tableau, Salesforce, legacy apps) for Smart Embed integration, or standalone sites for linking consideration within HUDX.
              </p>
              <a href="/hudx-test/react---3pd-embed-request" target="_blank" className="btn btn-primary mt-auto">
                Submit Integration Request
              </a>
            </div>
          </div>
        </div>

        {/* 3PD DESIGN SYSTEM */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 border-info shadow-sm dxpr-animate dxpr-fade-in dxpr-delay-5">
            <div className="card-body d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-palette text-primary me-3" style={{ fontSize: "2rem" }}></i>
                <h2 className="h3 mb-0">3PD Design System</h2>
              </div>
              <p className="card-text text-muted mb-4">
                Components, tokens, and patterns for building HUDX-consistent interfaces. Reference before building any 3PD application.
              </p>
              <a href="https://trussworks.github.io/react-uswds/?path=/docs/components-accordion--docs" target="_blank" className="btn btn-primary mt-auto">
                Storybook — Coming Soon
              </a>
            </div>
          </div>
        </div>

        {/* 3PD MODULE MANAGER */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 border-dark shadow-sm dxpr-animate dxpr-fade-in dxpr-delay-6">
            <div className="card-body d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-house-heart text-primary me-3" style={{ fontSize: "2rem" }}></i>
                <h2 className="h3 mb-0">3PD Module Manager</h2>
              </div>
              <p className="card-text text-muted mb-4">
                Review and manage content submitted by third-party developers across all active 3PD modules.
              </p>
              <a href="/hudx-test/astro-forms---3pd-checklist" target="_blank" className="btn btn-primary mt-auto">
                Manage 3PD Modules
              </a><br/>
              <a href="/admin/content" className="btn btn-primary mt-auto">
                Content Manager
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <div className="text-center mt-5 dxpr-animate dxpr-fade-in">
        <small className="text-muted">
          <i className="fa-solid fa-house-chimney me-2"></i>
          HUDX • 3PD Depot
        </small>
      </div>
    </div>
  );
}
