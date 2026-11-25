import jsQR from "jsqr";

/**
 * Browser helpers for decoding QR codes from uploaded images.
 * @module helpers/qr-upload
 */

/**
 * Maximum width used for decoding; larger images are scaled down.
 *
 * @type {number}
 */
const MAX_DECODE_WIDTH = 1024;

/**
 * Decodes a QR code from an image file.
 *
 * @param {File} file - Image file chosen by the user.
 * @returns {Promise<string | null>} Decoded payload, or `null` when no QR is found.
 */
export async function decodeQrImage(file) {
  if (!file || typeof document === "undefined") return null;
  const sourceUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.src = sourceUrl;
    await image.decode();

    const scale = Math.min(1, MAX_DECODE_WIDTH / Math.max(1, image.naturalWidth));
    const width = Math.max(1, Math.floor(image.naturalWidth * scale));
    const height = Math.max(1, Math.floor(image.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas is not available.");

    context.drawImage(image, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height);
    const code = jsQR(pixels.data, width, height, { inversionAttempts: "attemptBoth" });
    return code?.data ? String(code.data) : null;
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

/**
 * Opens a native file picker and decodes the chosen QR image.
 *
 * @returns {Promise<string | null>} Decoded payload, or `null` on cancel/no match.
 */
export function pickQrImage() {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      resolve(null);
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.png,.jpg,.jpeg,.webp";
    input.style.display = "none";
    document.body.appendChild(input);

    const cleanup = () => input.remove();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        cleanup();
        resolve(null);
        return;
      }
      try {
        resolve(await decodeQrImage(file));
      } catch (error) {
        reject(error);
      } finally {
        cleanup();
      }
    };
    input.onerror = () => {
      cleanup();
      reject(new Error("Could not open the image picker."));
    };

    input.click();
  });
}
