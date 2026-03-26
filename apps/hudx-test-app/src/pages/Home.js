export default function Home() {
  return (
    <div style={{ padding: "2rem 2rem 0 2rem" }}>

    {/* SECTION 1 — Intro Block */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>Welcome to the HUDX Test Application</h2>

        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vitae
          malesuada sapien. Integer ac sem id nunc tincidunt iaculis. Vivamus
          feugiat, lorem vel fermentum hendrerit, arcu risus porttitor lectus,
          vitae tincidunt neque lorem non urna. Suspendisse potenti. Cras
          suscipit, magna non facilisis tincidunt, justo libero dictum lorem,
          vitae volutpat lacus massa vitae massa. Vestibulum ante ipsum primis
          in faucibus orci luctus et ultrices posuere cubilia curae; Integer
          volutpat, arcu id gravida fermentum, massa lacus facilisis risus, sed
          vulputate lorem ipsum sed lorem. Sed id mi non arcu ultricies
          porttitor. Pellentesque habitant morbi tristique senectus et netus et
          malesuada fames ac turpis egestas. Integer id lorem sit amet neque
          suscipit tincidunt. Donec id risus eget velit bibendum tincidunt.
          Suspendisse potenti. Sed non sem sed ipsum tristique eleifend. Sed
          volutpat, velit id fermentum tincidunt, eros lorem posuere arcu, vitae
          tincidunt lorem lorem id ante. Integer id lorem nec nulla facilisis
          hendrerit. Sed vel augue id libero pretium tincidunt. Integer
          malesuada, justo nec facilisis suscipit, lorem velit tincidunt lorem,
          vitae tincidunt lorem lorem id ante.
        </p>

        <p>
          Curabitur id lorem nec nulla facilisis hendrerit. Sed vel augue id
          libero pretium tincidunt. Integer malesuada, justo nec facilisis
          suscipit, lorem velit tincidunt lorem, vitae tincidunt lorem lorem id
          ante. Integer id lorem nec nulla facilisis hendrerit. Sed vel augue id
          libero pretium tincidunt. Integer malesuada, justo nec facilisis
          suscipit, lorem velit tincidunt lorem, vitae tincidunt lorem lorem id
          ante. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices
          posuere cubilia curae; Integer volutpat, arcu id gravida fermentum,
          massa lacus facilisis risus, sed vulputate lorem ipsum sed lorem. Sed
          id mi non arcu ultricies porttitor. Pellentesque habitant morbi
          tristique senectus et netus et malesuada fames ac turpis egestas.
          Integer id lorem sit amet neque suscipit tincidunt. Donec id risus
          eget velit bibendum tincidunt. Suspendisse potenti. Sed non sem sed
          ipsum tristique eleifend. Sed volutpat, velit id fermentum tincidunt,
          eros lorem posuere arcu, vitae tincidunt lorem lorem id ante. Integer
          id lorem nec nulla facilisis hendrerit. Sed vel augue id libero
          pretium tincidunt. Integer malesuada, justo nec facilisis suscipit,
          lorem velit tincidunt lorem, vitae tincidunt lorem lorem id ante.
        </p>

        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vitae
          malesuada sapien. Integer ac sem id nunc tincidunt iaculis. Vivamus
          feugiat, lorem vel fermentum hendrerit, arcu risus porttitor lectus,
          vitae tincidunt neque lorem non urna. Suspendisse potenti. Cras
          suscipit, magna non facilisis tincidunt, justo libero dictum lorem,
          vitae volutpat lacus massa vitae massa. Vestibulum ante ipsum primis
          in faucibus orci luctus et ultrices posuere cubilia curae; Integer
          volutpat, arcu id gravida fermentum, massa lacus facilisis risus, sed
          vulputate lorem ipsum sed lorem. Sed id mi non arcu ultricies
          porttitor. Pellentesque habitant morbi tristique senectus et netus et
          malesuada fames ac turpis egestas. Integer id lorem sit amet neque
          suscipit tincidunt. Donec id risus eget velit bibendum tincidunt.
          Suspendisse potenti. Sed non sem sed ipsum tristique eleifend. Sed
          volutpat, velit id fermentum tincidunt, eros lorem posuere arcu, vitae
          tincidunt lorem lorem id ante. Integer id lorem nec nulla facilisis
          hendrerit. Sed vel augue id libero pretium tincidunt. Integer
          malesuada, justo nec facilisis suscipit, lorem velit tincidunt lorem,
          vitae tincidunt lorem lorem id ante.
        </p>
      </section>

      {/* SECTION 2 — Three Column Cards */}
      <section style={{ marginBottom: "3rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "1.5rem",
          }}
        >
          {/* Card 1 */}
          <div style={{ padding: "1rem", border: "1px solid #ccc" }}>
            <h3>Card One</h3>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer
              tincidunt, sapien nec congue porta, tellus risus ullamcorper mi, a
              rutrum justo eros pretium libero.
            </p>
          </div>

          {/* Card 2 */}
          <div style={{ padding: "1rem", border: "1px solid #ccc" }}>
            <h3>Card Two</h3>
            <p>
              Suspendisse potenti. Phasellus eget velit at dolor dictum placerat.
              Curabitur ac odio sit amet justo bibendum pulvinar.
            </p>
          </div>

          {/* Card 3 */}
          <div style={{ padding: "1rem", border: "1px solid #ccc" }}>
            <h3>Card Three</h3>
            <p>
              Vivamus vel sapien at lacus fermentum varius. Donec vel sem ut justo
              tincidunt gravida non nec velit.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3 — Centered Contact Card */}
      <section style={{ marginBottom: "3rem" }}>
        <div
          style={{
            width: "75%",
            margin: "0 auto",
            padding: "1.5rem",
            border: "1px solid #ccc",
          }}
        >
          <h3>Contact Us</h3>
          <p>
            If you have any questions about this demo or the HUDX Smart Embed
            integration, feel free to reach out. This card is intentionally sized at
            seventy‑five percent width to test centered layout behavior and height
            resizing inside the embedded React application.
          </p>
        </div>
      </section>


    </div>
  );
}
