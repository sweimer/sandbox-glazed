import { useState } from "react";

export default function Details() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <h2>Details Page</h2>
      <p>This page is tall and includes dynamic expanding content.</p>

      <button onClick={() => setExpanded(!expanded)}>
        {expanded ? "Collapse" : "Expand"}
      </button>

      {expanded && (
        <div style={{ marginTop: "1rem" }}>
          <p>Extra content block 1</p>
          <p>Extra content block 2</p>
          <p>Extra content block 3</p>
          <p>Extra content block 4</p>
          <p>Extra content block 5</p>
          <p>Extra content block 6</p>
        </div>
      )}
    </div>
  );
}
