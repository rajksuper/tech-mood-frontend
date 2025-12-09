// app/layout.jsx
export const metadata = {
  title: "The Tech Mood Dashboard",
  description: "AI-powered tech sentiment dashboard",
   icons: {
    icon: "/favicon-32x32.png",   // ← 32×32 becomes the DEFAULT
    shortcut: "/favicon-32x32.png",     // ← ICO still works as fallback
    apple: "/favicon-32x32.png",
  }
};



export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 20, fontFamily: "Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
