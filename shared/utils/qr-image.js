/**
 * Converts a rendered QR SVG into a downloadable PNG image.
 * @module shared/utils/qr-image
 */

/**
 * Saves a rendered QR `<svg>` element as a PNG file.
 *
 * @param {SVGSVGElement} svg - The QR SVG element from the DOM.
 * @param {string} filename - Download file name.
 * @param {number} [size=512] - Output image size in pixels.
 * @returns {Promise<void>}
 */
export async function saveQrPng(svg, filename, size = 512) {
  if (!svg || typeof document === "undefined") {
    throw new Error("QR image is not available.");
  }

  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  clone.setAttribute("width", String(size));
  clone.setAttribute("height", String(size));

  const markup = new XMLSerializer().serializeToString(clone);
  const sourceUrl = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml;charset=utf-8" }));

  try {
    const image = new Image();
    image.src = sourceUrl;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not available.");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size, size);
    context.drawImage(image, 0, 0, size, size);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Could not encode the QR image.");

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}
