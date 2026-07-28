import { ImageResponse } from "next/og";
export const runtime = "edge";
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "Knowledge Nest";
  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background: "#0f172a",
        color: "#ffffff",
      }}
    >
      <div
        style={{
          fontSize: 28,
          color: "#93c5fd",
          marginBottom: 24,
        }}
      >
        Knowledge Nest
      </div>
      <div
        style={{
          fontSize: 64,
          fontWeight: 700,
          lineHeight: 1.15,
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 40,
          fontSize: 28,
          color: "#cbd5e1",
        }}
      >
        Finance • Science • Technology • Health • Education
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}
