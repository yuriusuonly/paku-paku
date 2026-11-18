import { useCallback, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { Button } from "./button.js";
import { cx } from "../shared/constants/theme.js";

/**
 * Browser QR scanner using the native BarcodeDetector API when available.
 * Falls back to manual payload entry when camera scanning is unsupported.
 * @module components/qr-scanner
 */

/**
 * @param {{onDetect: (value: string) => void}} props
 * @returns {JSX.Element}
 */
export function QrScanner({ onDetect }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const detectorRef = useRef(null);
  const activeRef = useRef(false);

  const [supported, setSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
      typeof window.BarcodeDetector === "function" &&
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

      streamRef.current = stream;
      videoRef.current = video;
      detectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] });
      activeRef.current = true;
      setScanning(true);

      const detect = async () => {
        if (!activeRef.current || !detectorRef.current || !videoRef.current) return;
        try {
          const codes = await detectorRef.current.detect(videoRef.current);
          if (codes.length && codes[0].rawValue) {
            onDetect(String(codes[0].rawValue));
            stop();
            return;
          }
        } catch {
          // Ignore transient decode errors while the camera adjusts.
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
        Camera scanning is not supported in this browser. Paste the QR payload below.
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
