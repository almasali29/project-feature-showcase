import type { Figure } from "./manuscript";
import { figureSvg } from "./figure-svg";

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error("The figure image could not be rendered.")); image.src = src; });
}
export async function figurePngBytes(f: Figure, scale = 2): Promise<Uint8Array> {
  const source = f.kind === "image" ? f.image : URL.createObjectURL(new Blob([figureSvg(f)], { type: "image/svg+xml" }));
  try {
    const image = await loadImage(source); const canvas = document.createElement("canvas");
    canvas.width = f.kind === "image" ? Math.max(1, image.naturalWidth) : 900 * scale;
    canvas.height = f.kind === "image" ? Math.max(1, image.naturalHeight) : 520 * scale;
    const context = canvas.getContext("2d"); if (!context) throw new Error("Image export is unavailable in this browser.");
    context.fillStyle = "#FFFFFF"; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png")); if (!blob) throw new Error("Could not create the PNG.");
    return new Uint8Array(await blob.arrayBuffer());
  } finally { if (source.startsWith("blob:")) URL.revokeObjectURL(source); }
}
export function exportFigureSvg(f: Figure) { saveBlob(new Blob([figureSvg(f)], { type: "image/svg+xml" }), `${f.title || f.caption || "figure"}.svg`); }
export async function exportFigurePng(f: Figure) { saveBlob(new Blob([await figurePngBytes(f) as BlobPart], { type: "image/png" }), `${f.title || f.caption || "figure"}.png`); }
export function exportFigurePdf(f: Figure) {
  const popup = window.open("", "_blank"); if (!popup) throw new Error("Allow pop-ups to export this figure as PDF.");
  popup.document.write(`<!doctype html><html><head><title>${(f.title || f.caption || "Figure").replace(/[<>&]/g, "")}</title><style>body{font-family:serif;margin:24px}svg{max-width:100%;height:auto}@media print{body{margin:0}}</style></head><body>${figureSvg(f)}<p>${(f.caption || "").replace(/[<>&]/g, "")}</p><script>window.onload=()=>window.print()</script></body></html>`); popup.document.close();
}
