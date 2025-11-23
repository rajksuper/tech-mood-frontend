export async function GET() {
  const res = await fetch("http://127.0.0.1:8000/articles");
  const data = await res.json();

  return Response.json(data);
}
