import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UNDA | Semantic Benchmark KA",
  description: "ქართული semantic contract-ების დამოუკიდებელი შეფასება Jev-ისა და baseline მოდელებისთვის.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="ka"><body>{children}</body></html>;
}
