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
};

export default withNextIntl(nextConfig);
