import { useCallback, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import jsQR from "jsqr";
import { Button } from "./button.js";
import { cx } from "../shared/constants/theme.js";

/**
 * Browser camera QR scanner.
 *
 * Decodes camera frames with jsQR so scanning works in every browser with
 * getUserMedia, not only those exposing the native BarcodeDetector API.
 * Manual payload entry remains available as a fallback.
 * @module components/qr-scanner
 */

/**
 * Maximum width used for decode frames; camera previews stay full resolution.
 *
 * @type {number}
 */
const MAX_DECODE_WIDTH = 480;

/**
 * @param {{onDetect: (value: string) => void}} props
 * @returns {JSX.Element}
 */
export function QrScanner({ onDetect }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const activeRef = useRef(false);

  const [supported, setSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSupported(
      typeof navigator !== "undefined" &&
      typeof document !== "undefined" &&
      Boolean(navigator.mediaDevices?.getUserMedia)
    );
  }, []);

  const stop = useCallback(() => {
    activeRef.current = false;
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current?.parentNode) {
      videoRef.current.parentNode.removeChild(videoRef.current);
    }
    videoRef.current = null;
    canvasRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => stop, [stop]);

  const start = async () => {
    setError("");
    if (!supported || !containerRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.style.width = "100%";
      video.style.height = "100%";
      video.style.objectFit = "cover";
      video.srcObject = stream;
      containerRef.current.appendChild(video);
      await video.play();

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Canvas decoding is unavailable.");

      streamRef.current = stream;
      videoRef.current = video;
      canvasRef.current = canvas;
      activeRef.current = true;
      setScanning(true);

      const detect = () => {
        if (!activeRef.current || !videoRef.current || !canvasRef.current) return;
        const currentVideo = videoRef.current;
        if (currentVideo.readyState >= 2 && currentVideo.videoWidth && currentVideo.videoHeight) {
          const scale = Math.min(1, MAX_DECODE_WIDTH / currentVideo.videoWidth);
          const width = Math.max(1, Math.floor(currentVideo.videoWidth * scale));
          const height = Math.max(1, Math.floor(currentVideo.videoHeight * scale));
          canvas.width = width;
          canvas.height = height;
          try {
            context.drawImage(currentVideo, 0, 0, width, height);
            const imageData = context.getImageData(0, 0, width, height);
            const code = jsQR(imageData.data, width, height, {
              inversionAttempts: "dontInvert"
            });
            if (code?.data) {
              onDetect(String(code.data));
              stop();
              return;
            }
          } catch {
            // Ignore transient frame errors while the camera adjusts.
          }
        }
        frameRef.current = requestAnimationFrame(detect);
      };

      frameRef.current = requestAnimationFrame(detect);
    } catch {
      setError("Camera access is unavailable. Paste the QR payload below instead.");
      stop();
    }
  };

  if (!supported) {
    return (
      <Text className={`font-outfit text-xs ${cx.textInk60}`}>
        Camera scanning is not available here. Paste the QR payload below.
      </Text>
    );
  }

  return (
    <View className="gap-3">
      <View
        ref={containerRef}
        className={`h-52 w-full overflow-hidden ${cx.radius.md} border ${cx.borderSubtle} bg-black`}
      />
      <Button
        label={scanning ? "Stop camera" : "Scan with camera"}
        variant={scanning ? "ghost" : "secondary"}
        onPress={scanning ? stop : start}
      />
      {error ? <Text className={`font-outfit text-xs ${cx.textError}`}>{error}</Text> : null}
    </View>
  );
}
