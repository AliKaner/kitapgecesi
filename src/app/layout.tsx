import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KitapGecesi",
  description: "Kitap okuma, paylaşma ve kulüp deneyimi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${inter.variable} ${instrumentSerif.variable}`}>
      <body>
        <ConvexClientProvider>
          <AuthProvider>
            <I18nProvider>
              <ThemeProvider>{children}</ThemeProvider>
            </I18nProvider>
          </AuthProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
