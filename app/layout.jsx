// app/layout.jsx
export const metadata = {
  title: "The Tech Mood Dashboard",
  description: "AI-powered tech sentiment dashboard",
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
