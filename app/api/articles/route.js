export async function GET() {
  const res = await fetch("https://api.techsentiments.com/articles");
  const data = await res.json();

  return Response.json(data);
}
