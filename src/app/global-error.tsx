"use client";

// Kök layout çöktüğünde gösterilir; global stiller yüklenmez, bu yüzden stiller satır içi.
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="tr">
      <body style={{ margin: 0, background: "#f4ecdf", color: "#2b2420", fontFamily: "Georgia, serif" }}>
        <title>Bir şeyler ters gitti · hediyegetir</title>
        <main style={{ maxWidth: 480, margin: "15vh auto", padding: "0 16px" }}>
          <h1 style={{ fontSize: 32, margin: 0 }}>Bir şeyler ters gitti.</h1>
          <p style={{ fontFamily: "system-ui, sans-serif", lineHeight: 1.6 }}>
            Site şu an yüklenemedi. Birkaç saniye sonra tekrar dener misin?
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              font: "700 16px system-ui, sans-serif",
              padding: "10px 18px",
              background: "#b5523b",
              color: "#fbf7f0",
              border: "2px solid #2b2420",
              borderRadius: 6,
              boxShadow: "3px 3px 0 #2b2420",
              cursor: "pointer",
            }}
          >
            Tekrar dene
          </button>
        </main>
      </body>
    </html>
  );
}
