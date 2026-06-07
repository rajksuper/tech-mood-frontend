export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const upstream = new URL("https://api.techsentiments.com/articles/images");
    searchParams.forEach((value, key) => upstream.searchParams.set(key, value));

    const res = await fetch(upstream.toString(), { cache: "no-store" });
    if (!res.ok) {
      return Response.json({ articles: [], count: 0 }, { status: res.status });
    }
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return Response.json({ articles: [], count: 0 }, { status: 500 });
  }
}
