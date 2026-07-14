import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SKILLDER",
    short_name: "SKILLDER",
    description: "Descubra skills e ferramentas de agentes em alta.",
    start_url: "/app",
    display: "standalone",
    background_color: "#f2f5ff",
    theme_color: "#ff3f68",
    orientation: "portrait",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
