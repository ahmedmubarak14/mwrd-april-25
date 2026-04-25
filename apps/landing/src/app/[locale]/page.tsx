import { permanentRedirect } from "next/navigation";

// The marketing landing lives at the canonical GitHub Pages deployment.
// apps/landing in the monorepo just redirects there so any /mwrd.io traffic
// (or wherever this app deploys) lands on the real page.
const LANDING_URL = "https://ahmedmubarak14.github.io/mwrd-landing-page/";

export default function LandingHome(): never {
  permanentRedirect(LANDING_URL);
}
