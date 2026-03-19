import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 36,
          background: "linear-gradient(135deg, #C75B39, #E8845F)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="110"
          height="110"
          viewBox="0 0 24 24"
          fill="white"
          stroke="none"
        >
          <ellipse cx="12" cy="5" rx="2.5" ry="2" />
          <ellipse cx="6" cy="8" rx="2.2" ry="2" />
          <ellipse cx="18" cy="8" rx="2.2" ry="2" />
          <path d="M15.5 14c0 3-2.01 5.5-3.5 5.5S8.5 17 8.5 14 10.01 11 12 11s3.5 0 3.5 3z" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
