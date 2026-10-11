import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://mou-casper.vercel.app/", changeFrequency: "daily", priority: 1 }];
}
