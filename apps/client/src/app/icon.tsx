import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Programmatic favicon — orange rounded square + black MWRD mark.
 * Matches the brand icon supplied in the kit.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#ff6e42",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* MWRD icon mark scaled to 22×22 inside the 32px tile */}
        <svg
          width={22}
          height={22}
          viewBox="0 0 304.06 304.06"
          fill="#000000"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M149.22,216.98c15.67,26.34,24.88,55.62,27.42,87.09h-48.27C116.04,234.36,67.27,184.06,0,171.69v-50.36c41.62-8.71,71.14-26.69,97.48-59.42l35.88,37.78-49.96,48.48,4.09,2.9c25.83,18.3,46.6,40.48,61.72,65.92ZM176.69,0h-49.47c5.92,63.01,36.2,114.38,90.05,152.75l4.44,3.16-4.22,3.47c-16.35,13.42-32.18,27.04-46.14,45.61l35.72,36.05c29.47-35.41,58.03-52.31,97-57.45v-51.11C235.51,118.97,187.12,68.64,176.69,0Z" />
        </svg>
      </div>
    ),
    size,
  );
}
