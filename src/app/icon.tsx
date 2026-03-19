import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "linear-gradient(135deg, #C75B39, #E8845F)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Paw print SVG */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="white"
          stroke="none"
        >
          {/* Top center pad */}
          <ellipse cx="12" cy="5" rx="2.5" ry="2" />
          {/* Top left pad */}
          <ellipse cx="6" cy="8" rx="2.2" ry="2" />
          {/* Top right pad */}
          <ellipse cx="18" cy="8" rx="2.2" ry="2" />
          {/* Main pad */}
          <path d="M15.5 14c0 3-2.01 5.5-3.5 5.5S8.5 17 8.5 14 10.01 11 12 11s3.5 0 3.5 3z" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
