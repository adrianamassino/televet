import "@fontsource-variable/manrope";
import "@fontsource-variable/inter";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";
export const metadata = { title: "Televet", description: "Trouvez un vétérinaire et réservez en ligne" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="fr"><body>{children}<ChatWidget /></body></html>);
}
