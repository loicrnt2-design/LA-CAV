import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "La CAV'",
    short_name: "La CAV'",
    description: "Chinez. Achetez. Vendez.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4efe8",
    theme_color: "#f4efe8",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
