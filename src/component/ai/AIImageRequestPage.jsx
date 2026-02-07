import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  ImagePlus,
  MapPin,
  MessageSquareText,
  Route,
  Send,
  Square,
  UploadCloud,
  Loader2,
} from "lucide-react";
import { Card, ControlShell, SectionHeader } from "../../ui/primitives";

import LiveResponseRenderer from "./LiveResponseRenderer";

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

function getCameraErrorMessage(error) {
  const name = error?.name || "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Camera permission denied. Allow camera access in your browser/site settings.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No camera device was found on this machine.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "Camera is busy. Close other apps using the camera and try again.";
  }
  if (name === "OverconstrainedError") {
    return "Requested camera mode is not available on this device.";
  }
  if (name === "TypeError") {
    return "Invalid camera request. Please retry.";
  }
  return error?.message || "Unable to open camera";
}

async function attachStreamToVideo(videoElement, stream) {
  if (!videoElement) {
    throw new Error("Video preview element is missing");
  }

  videoElement.srcObject = stream;

  await new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(
        new Error(
          "Camera started but no video frames were received. Check browser camera permission and system privacy settings."
        )
      );
    }, 3500);

    const onLoaded = () => {
      cleanup();
      resolve();
    };

    const cleanup = () => {
      window.clearTimeout(timeout);
      videoElement.removeEventListener("loadedmetadata", onLoaded);
    };

    videoElement.addEventListener("loadedmetadata", onLoaded, { once: true });
  });

  await videoElement.play();

  if (!videoElement.videoWidth || !videoElement.videoHeight) {
    throw new Error(
      "Camera preview is still not ready. Please retry after allowing camera access."
    );
  }
}

async function requestBrowserLocation() {
  if (!navigator.geolocation) {
    throw new Error("Geolocation is not supported in this browser");
  }

  const position = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 120000,
    });
  });

  return {
    locationLatitude: position.coords.latitude,
    locationLongitude: position.coords.longitude,
  };
}

async function reverseGeocode(latitude, longitude) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to resolve address from coordinates");
  }

  const payload = await response.json();
  return typeof payload?.display_name === "string" ? payload.display_name : "";
}

export default function AIImageRequestPage({
  token,
  user,
  onBackToPlanner,
  onGoTripResponse,
}) {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [imageDataUrl, setImageDataUrl] = useState("");
  const [sharedLocation, setSharedLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("Location not shared");
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const [resultText, setResultText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(
    "Share location, upload image, capture photo, or type a prompt to start."
  );
  const [compressedBytes, setCompressedBytes] = useState(0);
  const [cameraOpen, setCameraOpen] = useState(false);

  const hasSendInput =
    Boolean(imageDataUrl) ||
    Boolean(sharedLocation) ||
    Boolean(userPrompt.trim());
  const canSend = hasSendInput && Boolean(user?.id) && !isSending;

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

      const cameraConstraints = [
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        {
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        {
          video: true,
          audio: false,
        },
      ];

      let stream = null;
      let lastError = null;

      for (const constraints of cameraConstraints) {
        let candidateStream = null;
        try {
          candidateStream = await navigator.mediaDevices.getUserMedia(
            constraints
          );
          try {
            await attachStreamToVideo(videoRef.current, candidateStream);
          } catch (attachError) {
            candidateStream.getTracks().forEach((track) => track.stop());
            throw attachError;
          }
          stream = candidateStream;
          break;
        } catch (candidateError) {
          lastError = candidateError;
          if (candidateStream) {
            candidateStream.getTracks().forEach((track) => track.stop());
          }
        }
      }

      if (!stream) {
        throw lastError || new Error("Unable to initialize camera preview");
      }

      streamRef.current = stream;
      setCameraOpen(true);
      setStatus("Camera ready. Capture a frame when you are set.");
    } catch (cameraError) {
      setError(getCameraErrorMessage(cameraError));
      setStatus("Camera unavailable. Fix permissions and try again.");
      stopCamera();
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) {
      setError(
        "Camera preview is not ready yet. Wait a moment or reopen the camera."
      );
      return;
    }

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

  const shareLocation = async () => {
    setIsSharingLocation(true);
    setError("");
    try {
      const location = await requestBrowserLocation();

      let resolvedAddress = "";
      try {
        resolvedAddress = await reverseGeocode(
          location.locationLatitude,
          location.locationLongitude
        );
      } catch {
        resolvedAddress = "";
      }

      const nextSharedLocation = {
        ...location,
        ...(resolvedAddress
          ? { address: resolvedAddress }
          : {
              address: `Approximate coordinates: ${location.locationLatitude.toFixed(
                5
              )}, ${location.locationLongitude.toFixed(5)}`,
            }),
      };

      setSharedLocation(nextSharedLocation);
      setLocationStatus(
        resolvedAddress
          ? `Shared: ${resolvedAddress}`
          : `Shared: ${location.locationLatitude.toFixed(
              5
            )}, ${location.locationLongitude.toFixed(5)}`
      );
      setStatus("Location shared. You can send now.");
    } catch (locationError) {
      setLocationStatus("Location not shared");
      setError(locationError.message || "Unable to share location");
    } finally {
      setIsSharingLocation(false);
    }
  };

  const sendImage = async () => {
    if (!canSend) return;

    setIsSending(true);
    setResultText("");
    setError("");
    setCompressedBytes(0);
    setStatus("Sending request to Gemini...");

    try {
      const requestBody = {
        userId: user.id,
        language: navigator.language || "English",
        ...(imageDataUrl ? { imageBase64: imageDataUrl } : {}),
        ...(sharedLocation || {}),
        ...(userPrompt.trim() ? { userPrompt: userPrompt.trim() } : {}),
      };

      const response = await fetch(`${API_BASE_URL}/api/v1/images`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(requestBody),
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
              title="Live Travel AI"
              subtitle="Real-time help from image, location, and prompt."
              right={
                <>
                  <button
                    type="button"
                    onClick={onGoTripResponse}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[#35505c] transition hover:border-[var(--line-strong)] hover:bg-[#fff8eb]"
                  >
                    <Route className="h-3.5 w-3.5" />
                    Trip Response
                  </button>

                  <button
                    type="button"
                    onClick={onBackToPlanner}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[#35505c] transition hover:border-[var(--line-strong)] hover:bg-[#fff8eb]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Planner
                  </button>
                </>
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

              <ControlShell className="bg-white">
                <div className="flex items-start gap-3">
                  <MessageSquareText className="mt-0.5 h-4 w-4 text-[#6d7c84]" />
                  <div className="w-full">
                    <p className="mb-2 text-[12px] font-semibold text-[#2e4752]">
                      Prompt For Live AI (optional)
                    </p>
                    <textarea
                      value={userPrompt}
                      onChange={(event) => setUserPrompt(event.target.value)}
                      rows={3}
                      placeholder="e.g. I am near this place. What should I do in the next 3 hours?"
                      className="w-full resize-y rounded-xl border border-[#dfd1ba] bg-[#fffdf9] px-3 py-2 text-[13px] text-[var(--ink)] outline-none placeholder:text-[#819199] focus:border-[var(--line-strong)]"
                    />
                  </div>
                </div>
              </ControlShell>

              <div className="rounded-[16px] border border-[#dbcfbc] bg-[#fff6e7] p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs font-medium text-[#566972]">
                    {locationStatus}
                  </div>
                  <button
                    type="button"
                    onClick={shareLocation}
                    disabled={isSharingLocation}
                    className={[
                      "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition",
                      isSharingLocation
                        ? "cursor-not-allowed border-[#d9ccb8] bg-[#f2e7d5] text-[#9a8f80]"
                        : "border-[var(--line)] bg-white text-[#2f4954] hover:border-[var(--line-strong)] hover:bg-[#fff8eb]",
                    ].join(" ")}
                  >
                    {isSharingLocation ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <MapPin className="h-3.5 w-3.5" />
                    )}
                    {isSharingLocation ? "Sharing..." : "Share Location"}
                  </button>
                </div>
              </div>

              <div className="rounded-[16px] border border-[#dbcfbc] bg-[#fff6e7] px-4 py-3 text-xs font-medium text-[#566972]">
                {previewLabel}
                {compressedBytes > 0
                  ? ` • compressed ${formatBytes(compressedBytes)}`
                  : ""}
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
                    Send To Live Travel AI
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
              title="Live Travel AI Response"
              subtitle={status}
            />

            <div className="min-h-[460px] rounded-[20px] border border-[var(--line)] bg-[var(--surface-soft)] p-4 sm:p-5">
              {resultText ? (
                <div className="max-h-[560px] overflow-y-auto pr-1">
                  <LiveResponseRenderer text={resultText} />
                </div>
              ) : (
                <div className="flex min-h-[420px] items-center justify-center text-center text-[13px] text-[#6a7b84]">
                  {isSending
                    ? "Streaming AI response..."
                    : "No live response yet. Send location, image, or prompt."}
                </div>
              )}
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
