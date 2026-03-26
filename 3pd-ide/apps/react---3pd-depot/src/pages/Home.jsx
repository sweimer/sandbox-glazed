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
        <span className="text-primary fw-bold">
          <i className="bi bi-gear me-2"></i>
          Choose Your Build Path
        </span>
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
              <a href="#" className="btn btn-primary">
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
              <span className="text-uppercase display-6 align-center">
                Coming Soon!!
              </span>
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
                className="btn btn-secondary"
                onClick={() => setShowProCodeRepos(!showProCodeRepos)}
              >
                {showProCodeRepos ? "Hide Starter Kits" : "View Starter Kits"}
              </button>

              {showProCodeRepos && (
                <ul className="list-unstyled small mt-2 mb-0">
                  <li><a href="#" className="link-success">React Starter Kit</a></li>
                  <li><a href="#" className="link-success">Angular Starter Kit</a></li>
                  <li><a href="#" className="link-success">Astro Starter Kit</a></li>
                  <li><a href="#" className="link-success">Fuse Starter Kit</a></li>
                  <li><a href="#" className="link-success">Drupal Module Starter Kit</a></li>
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* 3PD STAND-ALONE EMBEDS */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 border-warning shadow-sm dxpr-animate dxpr-fade-in dxpr-delay-4">
            <div className="card-body d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-wrench-adjustable text-primary me-3" style={{ fontSize: "2rem" }}></i>
                <h2 className="h3 mb-0">3PD Stand‑Alone <br/>Smart Embeds</h2>
              </div>
              <p className="card-text text-muted mb-4">
                Submit external tools such as Tableau, Salesforce, or legacy apps for governed Smart Embed integration.
              </p>
              <a href="#" className="btn btn-primary">
                Submit Smart Embed Request
              </a>
            </div>
          </div>
        </div>

        {/* 3PD STAND-ALONE PROPERTIES */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 border-secondary shadow-sm dxpr-animate dxpr-fade-in dxpr-delay-5">
            <div className="card-body d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-hammer text-primary me-3" style={{ fontSize: "2rem" }}></i>
                <h2 className="h3 mb-0">3PD Stand‑Alone <br/>Properties</h2>
              </div>
              <p className="card-text text-muted mb-4">
                Submit standalone external sites or applications for linking consideration within HUDX.
              </p>
              <a href="#" className="btn btn-primary">
                Submit External Link
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
