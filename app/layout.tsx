import "./globals.css";

export const metadata = {
  title: "Recenze | Ateliér Ivet",
  description: "Recenze zákaznic Ateliéru Ivet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
