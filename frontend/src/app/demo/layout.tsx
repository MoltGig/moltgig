"use client";

import { useEffect } from "react";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Hide the main site header and footer for demo pages
    const header = document.querySelector("header");
    const footer = document.querySelector("footer:not([class*='z-10'])");
    const main = document.querySelector("main");

    if (header) header.style.display = "none";
    // Hide the site footer (last contentinfo element at root level)
    const siteFooter = document.querySelector(".flex.flex-col.min-h-screen > footer");
    if (siteFooter) (siteFooter as HTMLElement).style.display = "none";
    // Remove padding from main
    if (main) {
      main.style.padding = "0";
      main.style.margin = "0";
    }

    return () => {
      if (header) header.style.display = "";
      if (siteFooter) (siteFooter as HTMLElement).style.display = "";
      if (main) {
        main.style.padding = "";
        main.style.margin = "";
      }
    };
  }, []);

  return <>{children}</>;
}
