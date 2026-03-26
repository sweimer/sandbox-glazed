import { useState } from "react";

export default function Stracat() {
  // Simple state for demo calculator
  const [noiseLevel, setNoiseLevel] = useState("");
  const [wallArea, setWallArea] = useState("");
  const [windowArea, setWindowArea] = useState("");
  const [doorArea, setDoorArea] = useState("");
  const [result, setResult] = useState(null);

  function calculate() {
    // Fake calculation for demo
    const totalArea =
      Number(wallArea || 0) +
      Number(windowArea || 0) +
      Number(doorArea || 0);

    const requiredSTC = noiseLevel
      ? Math.min(70, Number(noiseLevel) + 5)
      : 0;

    const meets = totalArea > 0 && requiredSTC < 65;

    setResult({
      totalArea,
      requiredSTC,
      meets,
    });
  }

  return (
    <div className="container py-4">

      {/* Breadcrumb */}
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="#">Home</a></li>
          <li className="breadcrumb-item"><a href="#">Environmental Review</a></li>
          <li className="breadcrumb-item active" aria-current="page">STraCAT</li>
        </ol>
      </nav>

      {/* Page Title */}
      <h1 className="mb-3">Sound Transmission Classification Assessment Tool (STraCAT)</h1>

      {/* Intro Text */}
      <div className="mura-region-local">
        <p>
          <strong>Overview</strong>
        </p>
        <p>The Sound&nbsp;Transmission Classification Assessment Tool (STraCAT) is an electronic version of Figures 17
          and 19 in The HUD Noise Guidebook. The purpose of this tool is to document sound attenuation performance of
          wall systems. Based on wall, window, and door Sound Transmission Classification (STC) values, the STraCAT
          generates a composite STC value for the wall assembly as a whole. Users can enter the calculated noise level
          related to a specific Noise Assessment Location in front of a building façade and STraCAT will generate a
          target required attenuation value for the wall assembly in STC. Based on wall materials, the tool will state
          whether the composite wall assembly STC meets the required attenuation value.</p>
        <p>
          <strong>How to Use This Tool</strong>
        </p>
        <p>
          <u>
            <em>Location, Noise Level and Wall Configuration to Be Analyzed</em>
          </u>
          <br/>
          STraCAT is designed to calculate the attenuation provided by the wall assembly for one wall of one unit. If
          unit exterior square footage and window/door configuration is identical around the structure, a single STraCAT
          may be sufficient. If units vary, at least one STraCAT should be completed for each different exterior unit
          wall configuration to document that all will achieve the required attenuation. Additionally, if attenuation is
          not based on a single worst-case NAL, but there are multiple NALs which require different levels of
          attenuation around the structure, a STraCAT should be completed for each differing exterior wall configuration
          associated with each NAL.
        </p>
        <p>Exterior wall configurations associated with an NAL include those with parallel (facing) or near-parallel
          exposure as well as those with perpendicular exposure. When a façade has parallel or perpendicular exposure to
          two or more NALs, you should base the required attenuation on the NAL with the highest calculated noise level.
          For corner units where the unit interior receives exterior noise through two facades, the STraCAT calculation
          should incorporate the area of wall, window and door materials pertaining to the corner unit’s total exterior
          wall area (i.e., from both walls).</p>
        <p>
          <u>
            <em>Information to Be Entered</em>
          </u>
          <br/>
          Users first enter basic project information and the NAL noise level that will be used as the basis for
          required attenuation. This noise level must be entered in whole numbers. STraCAT users then enter information
          on wall, window and door component type and area. Again, as noted above, the wall, window and door entries are
          based on one unit, and one wall (except for corner units as discussed above). The tool sums total wall square
          footage based on the combined area of walls, doors and windows for the façade being evaluated.
        </p>
        <p>Users may input STC values for materials in one of two ways. The tool includes a dropdown menu of common
          construction materials with STC values prefilled. If selected construction materials are not included in this
          dropdown menu, the user may also enter the STC for a given component manually. Verification of the component
          STC must be included in the ERR. Documentation includes the architect or construction manager’s project plans
          showing wall material specifications. For new construction or for components that will be newly installed in
          an existing wall, documentation also includes the manufacturer’s product specification sheet (cut sheet)
          documenting the STC rating of selected doors and windows.</p>
        <p>
          <u>
            <em>Required STC Rating and Determination of Compliance</em>
          </u>
          <br/>
          Finally, based on project information entered the tool will indicate the required STC rating for the wall
          assembly being evaluated and whether or not the materials specified will produce a combined rating that meets
          this requirement. Note that for noise levels above 75 dB DNL, either HUD (for 24 CFR Part 50 reviews) or the
          Responsible Entity (for 24 CFR Part 58 reviews) must approve the level and type of attenuation, among other
          processing requirements.
          <u>Required attenuation values generated by STraCAT for NALs above 75 dB DNL should therefore be considered
            tentative pending approval by HUD or the RE.</u>
        </p>
        <p>For detailed guidance, review the
          <a href="https://www.hudexchange.info/resource/2829/sound-transmission-classification-assessment-tool/">STraCAT
            User Guide</a>.
        </p>
      </div>

      {/* --- PART I --- */}
      <div className="card mb-4">
        <div className="card-header fw-bold">Part I – Project Information</div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Noise Level (dB)</label>
              <input
                type="number"
                className="form-control"
                value={noiseLevel}
                onChange={(e) => setNoiseLevel(e.target.value)}
              />
            </div>

            <div className="col-md-8">
              <p className="text-muted">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                Integer nec odio. Praesent libero.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- PART II --- */}
      <div className="card mb-4">
        <div className="card-header fw-bold">Part II – Wall, Window & Door Areas</div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Wall Area (sq ft)</label>
              <input
                type="number"
                className="form-control"
                value={wallArea}
                onChange={(e) => setWallArea(e.target.value)}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Window Area (sq ft)</label>
              <input
                type="number"
                className="form-control"
                value={windowArea}
                onChange={(e) => setWindowArea(e.target.value)}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Door Area (sq ft)</label>
              <input
                type="number"
                className="form-control"
                value={doorArea}
                onChange={(e) => setDoorArea(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- PART III --- */}
      <div className="card mb-4">
        <div className="card-header fw-bold">Part III – Results</div>
        <div className="card-body">
          <button className="btn btn-primary mb-3" onClick={calculate}>
            Calculate
          </button>

          {result && (
            <div className="alert alert-info">
              <p><strong>Total Area:</strong> {result.totalArea} sq ft</p>
              <p><strong>Required STC:</strong> {result.requiredSTC}</p>
              <p>
                <strong>Meets Requirements:</strong>{" "}
                {result.meets ? "Yes" : "No"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* --- PART IV --- */}
      <div className="card mb-4">
        <div className="card-header fw-bold">Part IV – Tips</div>
        <div className="card-body">
          <ul>
            <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</li>
            <li>Vivamus sagittis lacus vel augue laoreet rutrum faucibus.</li>
            <li>Donec id elit non mi porta gravida at eget metus.</li>
            <li>
              More info:{" "}
              <a href="https://google.com" target="_blank" rel="noreferrer">
                google.com
              </a>
            </li>
          </ul>
        </div>
      </div>

    </div>
  );
}
