import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@mwrd/db",
    "@mwrd/i18n",
    "@mwrd/invoicing",
    "@mwrd/payments",
    "@mwrd/po-engine",
    "@mwrd/ui",
  ],
  // Turbopack: resolve .js imports to .ts/.tsx in workspace packages
  turbopack: {
    resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".cjs"],
  },
};

export default withNextIntl(nextConfig);
