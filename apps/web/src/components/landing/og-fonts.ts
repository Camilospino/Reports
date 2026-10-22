// Onest para las imágenes de vista previa (la fuente por defecto de next/og no tiene negrilla).
// Solo se descargan las letras de `text`. Si la descarga falla, la imagen sale con la fuente por defecto.
async function onest(weight: number, text: string) {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Onest:wght@${weight}&text=${encodeURIComponent(text)}`)).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return await (await fetch(url)).arrayBuffer();
  } catch {
    return null;
  }
}

export async function ogFonts(text: string) {
  const [regular, bold] = await Promise.all([onest(500, text), onest(800, text)]);
  return [
    ...(regular ? [{ name: "Onest", data: regular, weight: 500 as const, style: "normal" as const }] : []),
    ...(bold ? [{ name: "Onest", data: bold, weight: 800 as const, style: "normal" as const }] : []),
  ];
}
