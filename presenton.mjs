// Optional real Presenton REST integration. Configuration stays server-side.
export async function generateWithPresenton(
  deck,
  {
    baseUrl = process.env.PRESENTON_URL,
    key = process.env.PRESENTON_API_KEY,
    template = "general",
    fetcher = fetch,
  } = {},
) {
  if (!baseUrl || !key)
    throw Error(
      "Ustaw PRESENTON_URL i PRESENTON_API_KEY dla swojej instancji Presenton.",
    );
  const response = await fetcher(
    new URL("/api/v1/ppt/presentation/generate", baseUrl),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: deck.title,
        slides_markdown: deck.slides.map(
          (s) =>
            "# " + s.title + "\n\n" + s.points.map((p) => "- " + p).join("\n"),
        ),
        language: "Polish",
        template,
        export_as: "pptx",
        n_slides: deck.slides.length,
      }),
      signal: AbortSignal.timeout(240000),
    },
  );
  if (!response.ok) throw Error("Presenton zwrócił HTTP " + response.status);
  return response.json();
}
