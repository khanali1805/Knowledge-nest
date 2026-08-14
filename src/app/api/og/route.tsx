import { ImageResponse } from "next/og";
export const runtime = "edge";
const CATEGORY_IMAGES: Record<string, string> = {
  "beauty-skincare": "/icons/categories/beauty-skincare.png",
  "food-recipes": "/icons/categories/food-recipes.png",
  "health-fitness-wellness": "/icons/categories/health-fitness-wellness.png",
  "home-dcor-organization": "/icons/categories/home-decor-organization.png",
  "money-career": "/icons/categories/money-career.png",
  "relationships-family": "/icons/categories/relationships-family.png",
  "travel-lifestyle": "/icons/categories/travel-lifestyle.png",
  "womens-fashion-style": "/icons/categories/womens-fashion-style.png",
};
function getAbsoluteAssetUrl(requestUrl: string, assetPath: string): string {
  return new URL(assetPath, requestUrl).toString();
}
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title")?.trim() || "Knowledge Nest";
  const kind = searchParams.get("kind")?.trim().toLowerCase() || "default";
  const categorySlug = searchParams.get("category")?.trim().toLowerCase() || "";
  const isHomepage = kind === "home";
  const categoryImagePath =
    kind === "category" ? CATEGORY_IMAGES[categorySlug] : undefined;
  const visualImage = isHomepage
    ? getAbsoluteAssetUrl(request.url, "/images/homepage/knowledge-nest-hero-woman.png")
    : categoryImagePath
      ? getAbsoluteAssetUrl(request.url, categoryImagePath)
      : null;
  const eyebrow = isHomepage
    ? "KNOWLEDGE • STORIES • INFORMATION"
    : kind === "category"
      ? "EXPLORE KNOWLEDGE NEST"
      : "KNOWLEDGE NEST";
  const supportingText = isHomepage
    ? "Trusted knowledge for everyone."
    : kind === "category"
      ? "Useful guides, ideas and articles selected for this category."
      : "Useful knowledge, practical guides and informative stories.";
  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(135deg, #ffffff 0%, #f5f3ff 48%, #ede9fe 100%)",
        color: "#1e1b4b",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: "420px",
          height: "420px",
          borderRadius: "999px",
          top: "-170px",
          right: "-80px",
          background: "rgba(139, 92, 246, 0.16)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "300px",
          height: "300px",
          borderRadius: "999px",
          left: "-120px",
          bottom: "-130px",
          background: "rgba(196, 181, 253, 0.28)",
        }}
      />
      <div
        style={{
          display: "flex",
          width: visualImage ? "68%" : "100%",
          height: "100%",
          flexDirection: "column",
          justifyContent: "center",
          padding: "70px 72px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 23,
            fontWeight: 800,
            letterSpacing: "0.12em",
            color: "#6d28d9",
            marginBottom: 24,
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            display: "flex",
            maxWidth: visualImage ? "720px" : "1000px",
            fontSize: title.length > 55 ? 52 : 64,
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: "-0.035em",
            color: "#1e1b4b",
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            maxWidth: "720px",
            marginTop: 28,
            fontSize: 27,
            lineHeight: 1.35,
            color: "#5b5675",
          }}
        >
          {supportingText}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 34,
            fontSize: 22,
            fontWeight: 800,
            color: "#7c3aed",
          }}
        >
          knowledgenest.site
        </div>
      </div>
      {visualImage ? (
        <div
          style={{
            display: "flex",
            width: "32%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            padding: kind === "category" ? "88px 55px" : "28px 32px 0 0",
          }}
        >
          <img
            src={visualImage}
            alt=""
            style={
              kind === "category"
                ? {
                    width: "280px",
                    height: "280px",
                    objectFit: "contain",
                    borderRadius: "42px",
                    boxShadow: "0 24px 60px rgba(76, 29, 149, 0.18)",
                  }
                : {
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    objectPosition: "bottom center",
                  }
            }
          />
        </div>
      ) : null}
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}
