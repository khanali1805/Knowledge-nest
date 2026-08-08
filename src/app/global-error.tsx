"use client";
export default function GlobalError({
  reset,
}: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            fontFamily: "system-ui, sans-serif",
            background: "#f8fafc",
            color: "#0f172a",
          }}
        >
          <section
            style={{
              width: "100%",
              maxWidth: "640px",
              padding: "32px",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              background: "#ffffff",
              textAlign: "center",
            }}
          >
            <h1>Knowledge Nest is temporarily unavailable.</h1>
            <p>
              The application encountered an unexpected error. Retry the application
              safely.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: "16px",
                padding: "10px 18px",
                border: "0",
                borderRadius: "8px",
                background: "#0f172a",
                color: "#ffffff",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
