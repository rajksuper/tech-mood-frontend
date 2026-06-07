export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const upstream = new URL("https://api.techsentiments.com/articles/images");
  searchParams.forEach((value, key) => upstream.searchParams.set(key, value));

  const res = await fetch(upstream.toString());
  const data = await res.json();
  return Response.json(data);
}
