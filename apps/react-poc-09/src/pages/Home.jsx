export default function Home() {
  return (
    <div style={{ padding: "1rem" }}>
      {/* Row 1 */}
      <div>
        <h3>This is App 9</h3>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
          ullamcorper, urna at placerat luctus, lorem massa tincidunt arcu, nec
          fermentum justo lorem non mi.
        </p>
      </div>

      {/* Row 2 */}
      <div>
        <h3>Section 2</h3>
        <p>
          Curabitur vitae sapien ac velit pulvinar tincidunt. Integer sit amet
          arcu nec risus convallis tincidunt. Suspendisse potenti. Donec
          bibendum, velit non posuere luctus, lorem felis volutpat libero.
        </p>
      </div>

      {/* Row 3 */}
      <div>
        <h3>Section Three</h3>
        <p>
          Praesent vel augue nec urna cursus tincidunt. Vivamus id magna
          pharetra, volutpat lorem non, interdum libero. Sed id arcu nec justo
          feugiat malesuada.
        </p>
      </div>

      {/* Row 4 — Table */}
      <div>
        <h2>Data Table</h2>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "1rem",
          }}
        >
          <thead>
          <tr>
            <th style={cellStyle}>Column 1</th>
            <th style={cellStyle}>Column 2</th>
            <th style={cellStyle}>Column 3</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td style={cellStyle}>Lorem ipsum dolor sit amet</td>
            <td style={cellStyle}>Consectetur adipiscing elit</td>
            <td style={cellStyle}>Sed do eiusmod tempor</td>
          </tr>
          <tr>
            <td style={cellStyle}>Ut enim ad minim veniam</td>
            <td style={cellStyle}>Quis nostrud exercitation</td>
            <td style={cellStyle}>Ullamco laboris nisi</td>
          </tr>
          <tr>
            <td style={cellStyle}>Duis aute irure dolor</td>
            <td style={cellStyle}>In reprehenderit in voluptate</td>
            <td style={cellStyle}>Velit esse cillum dolore</td>
          </tr>
          <tr>
            <td style={cellStyle}>Excepteur sint occaecat</td>
            <td style={cellStyle}>Cupidatat non proident</td>
            <td style={cellStyle}>Sunt in culpa qui officia</td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

const cellStyle = {
  border: "1px solid #ccc",
  padding: "8px",
  textAlign: "left",
};
