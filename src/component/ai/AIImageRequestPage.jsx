import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  ImagePlus,
  Loader2,
  Send,
  Square,
  UploadCloud,
} from "lucide-react";
import { Card, ControlShell, SectionHeader } from "../../ui/primitives";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:9008"
).replace(/\/$/, "");

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read selected file"));
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function getLocationPayload() {
  if (!navigator.geolocation) return {};

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 6000,
        maximumAge: 120000,
      });
    });

    return {
      locationLatitude: position.coords.latitude,
      locationLongitude: position.coords.longitude,
    };
  } catch {
    return {};
  }
}

export default function AIImageRequestPage({ token, user, onBackToPlanner }) {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [imageDataUrl, setImageDataUrl] = useState("");
  const [resultText, setResultText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Attach an image to start.");
  const [compressedBytes, setCompressedBytes] = useState(0);
  const [cameraOpen, setCameraOpen] = useState(false);

  const canSend = Boolean(imageDataUrl) && Boolean(user?.id) && !isSending;

  const previewLabel = useMemo(() => {
    if (!imageDataUrl) return "No image selected";
    const prefix = imageDataUrl.startsWith("data:image")
      ? imageDataUrl.slice(5, imageDataUrl.indexOf(";"))
      : "image";
    return `${prefix} ready`;
  }, [imageDataUrl]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOpen(false);
  };

  const startCamera = async () => {
    setError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API is not supported in this browser");
      }

      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraOpen(true);
      setStatus("Camera ready. Capture a frame when you are set.");
    } catch (cameraError) {
      setError(cameraError.message || "Unable to open camera");
      stopCamera();
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setImageDataUrl(dataUrl);
    setResultText("");
    setError("");
    setStatus("Photo captured. Ready to send.");
    stopCamera();
  };

  const handleSelectFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await fileToDataUrl(file);
      setImageDataUrl(dataUrl);
      setResultText("");
      setError("");
      setStatus("Image loaded. Ready to send.");
      stopCamera();
    } catch (fileError) {
      setError(fileError.message || "Failed to load image");
    } finally {
      if (event.target) event.target.value = "";
    }
  };

  const sendImage = async () => {
    if (!canSend) return;

    setIsSending(true);
    setResultText("");
    setError("");
    setCompressedBytes(0);
    setStatus("Sending image to AI...");

    try {
      const location = await getLocationPayload();
      const response = await fetch(`${API_BASE_URL}/api/v1/images`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          imageBase64: imageDataUrl,
          userId: user.id,
          language: navigator.language || "English",
          ...location,
        }),
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");
        throw new Error(bodyText || "Image request failed");
      }

      if (!response.body) {
        throw new Error("No response stream received from backend");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const chunk = await reader.read();
        done = chunk.done;
        buffer += decoder.decode(chunk.value || new Uint8Array(), {
          stream: !chunk.done,
        });

        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const rawEvent = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          boundary = buffer.indexOf("\n\n");

          const dataPayload = rawEvent
            .split("\n")
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trim())
            .join("\n");

          if (!dataPayload) continue;

          let event;
          try {
            event = JSON.parse(dataPayload);
          } catch {
            continue;
          }

          if (event.type === "delta" && event.text) {
            setResultText((prev) => prev + event.text);
          } else if (event.type === "image") {
            setCompressedBytes(Number(event.compressedBytes || 0));
          } else if (event.type === "stream_start") {
            setStatus("AI is generating...");
          } else if (event.type === "complete") {
            setStatus("Generation complete.");
          } else if (event.type === "history_saved") {
            setStatus("Done and saved to history.");
          } else if (event.type === "error") {
            throw new Error(event.message || "Backend stream error");
          }
        }
      }
    } catch (requestError) {
      setError(requestError.message || "Failed to generate result");
      setStatus("Request failed.");
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => () => stopCamera(), []);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="lg:col-span-5">
          <Card>
            <SectionHeader
              icon={<ImagePlus className="h-5 w-5" />}
              title="AI Image Assistant"
              subtitle="Upload an image or capture from camera, then send to Gemini."
              right={
                <button
                  type="button"
                  onClick={onBackToPlanner}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[#35505c] transition hover:border-[var(--line-strong)] hover:bg-[#fff8eb]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Planner
                </button>
              }
            />

            <div className="space-y-4">
              <ControlShell className="bg-white">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSelectFile}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[#fff8eb] px-3.5 py-2 text-xs font-semibold text-[#2f4954] transition hover:border-[var(--line-strong)] hover:bg-[#ffeecd]"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    Upload Image
                  </button>

                  {!cameraOpen ? (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3.5 py-2 text-xs font-semibold text-[#2f4954] transition hover:border-[var(--line-strong)] hover:bg-[#fff8eb]"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      Open Camera
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="inline-flex items-center gap-2 rounded-full border border-[#d6c7b0] bg-[#fff4e0] px-3.5 py-2 text-xs font-semibold text-[#5b4728] transition hover:bg-[#ffebcb]"
                    >
                      <Square className="h-3.5 w-3.5" />
                      Stop Camera
                    </button>
                  )}
                </div>
              </ControlShell>

              {cameraOpen ? (
                <Card className="border-[#d9ccb7] bg-[#fff9ed] p-4">
                  <div className="overflow-hidden rounded-[18px] border border-[#d8ccb7] bg-black">
                    <video
                      ref={videoRef}
                      className="aspect-video w-full object-cover"
                      playsInline
                      muted
                      autoPlay
                    />
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0d6a66] to-[#084744] px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(12,95,92,0.28)] transition hover:brightness-105"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      Capture Photo
                    </button>
                  </div>
                </Card>
              ) : null}

              {imageDataUrl ? (
                <div className="overflow-hidden rounded-[20px] border border-[#d8ccb7] bg-[#fffaf1]">
                  <img
                    src={imageDataUrl}
                    alt="Selected"
                    className="aspect-video w-full object-cover"
                  />
                </div>
              ) : null}

              <div className="rounded-[16px] border border-[#dbcfbc] bg-[#fff6e7] px-4 py-3 text-xs font-medium text-[#566972]">
                {previewLabel}
                {compressedBytes > 0 ? ` • compressed ${formatBytes(compressedBytes)}` : ""}
              </div>

              <button
                type="button"
                onClick={sendImage}
                disabled={!canSend}
                className={[
                  "inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition",
                  canSend
                    ? "bg-gradient-to-r from-[#0d6a66] to-[#084744] text-white shadow-[0_12px_28px_rgba(12,95,92,0.30)] hover:brightness-105"
                    : "cursor-not-allowed bg-[#ccd6d9] text-white",
                ].join(" ")}
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send To Gemini
                  </>
                )}
              </button>

              {error ? (
                <p className="rounded-xl border border-[#e5c2b9] bg-[#fff2ef] px-3 py-2 text-sm text-[#8b3f2d]">
                  {error}
                </p>
              ) : null}
            </div>
          </Card>
        </section>

        <section className="lg:col-span-7">
          <Card className="h-full">
            <SectionHeader
              icon={<Send className="h-5 w-5" />}
              title="Generation Result"
              subtitle={status}
            />

            <div className="min-h-[420px] rounded-[20px] border border-[var(--line)] bg-[var(--surface-soft)] p-4 sm:p-5">
              {resultText ? (
                <pre className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-[#243944]">
                  {resultText}
                </pre>
              ) : (
                <div className="flex h-full min-h-[380px] items-center justify-center text-center text-[13px] text-[#6a7b84]">
                  {isSending ? "Streaming AI response..." : "No response yet. Send an image to start."}
                </div>
              )}
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
