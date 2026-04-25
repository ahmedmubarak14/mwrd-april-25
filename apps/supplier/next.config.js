import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTE: apps/supplier intentionally does NOT import @mwrd/db. Supplier-side
  // data access goes through @mwrd/po-engine which wraps the supplier-scoped
  // Supabase client. Defense in depth — the app literally cannot import the
  // buyer-scoped `orders` client.
  transpilePackages: [
    "@mwrd/i18n",
    "@mwrd/payments",
    "@mwrd/po-engine",
    "@mwrd/ui",
  ],
};

export default withNextIntl(nextConfig);
