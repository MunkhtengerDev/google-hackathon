import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import GuideTab from "./components/GuideTab";
import MemoriesTab from "./components/MemoriesTab";
import ResponsePlanEmptyState from "./components/ResponsePlanEmptyState";
import ResponsePlanHeaderCard from "./components/ResponsePlanHeaderCard";
import ResponsePlanSidebar from "./components/ResponsePlanSidebar";
import RightNowTab from "./components/RightNowTab";
import TimelineTab from "./components/TimelineTab";
import WalletTab from "./components/WalletTab";
import {
  API_BASE_URL,
  DRIVE_ROOT_FOLDER_NAME,
  GOOGLE_CLIENT_ID,
  GOOGLE_DRIVE_SCOPE,
  buildDetailedTimelineText,
  buildGoogleMapsLink,
  buildMemoryDetail,
  buildMemoryUploadName,
  buildPlaceFallbackImageLink,
  buildPlaceImageLink,
  buildPlaceVisitDetails,
  buildTimelineHeadline,
  extractBudgetItems,
  extractDays,
  extractDestinationHints,
  extractPlacesFromTimelineText,
  fileToDataUrl,
  fetchDriveImageBlobUrl,
  findOrCreateDriveFolder,
  formatFileSize,
  formatTimestamp,
  inferApproxWeatherFromText,
  inferPlaceName,
  loadGoogleIdentityScript,
  makeDriveFilePublic,
  normalizeMemoryRecord,
  parseMarkdownSections,
  resolveApproxWeather,
  resolveWikipediaPhoto,
  toGuideList,
  toGuideObjectList,
  uniqueTextList,
  uploadImageToDrive,
} from "./responsePlanUtils";

export default function ResponsePlan({
  title = "Trip Dashboard",
  subtitle = "Switch views from the sidebar to explore your plan.",
  responseText = "",
  planResponseText = "",
  isLoading = false,
  loadError = "",
  lastPlanAt = "",
  guideCompanion = null,
  guideLoading = false,
  guideError = "",
  token = "",
  user = null,
  onRefresh,
  rightNowContext,
}) {
  const memoryFileInputRef = useRef(null);
  const [active, setActive] = useState("timeline");
  const [activeTimelineDayId, setActiveTimelineDayId] = useState("");
  const [photoResolutionByStop, setPhotoResolutionByStop] = useState({});
  const [memories, setMemories] = useState([]);
  const [memoriesLoading, setMemoriesLoading] = useState(false);
  const [memoriesError, setMemoriesError] = useState("");
  const [selectedMemoryFiles, setSelectedMemoryFiles] = useState([]);
  const [memoryCaption, setMemoryCaption] = useState("");
  const [memoryDayLabel, setMemoryDayLabel] = useState("");
  const [isSavingMemories, setIsSavingMemories] = useState(false);
  const [driveStatus, setDriveStatus] = useState("Google Drive not connected");
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveImageBlobUrlByFileId, setDriveImageBlobUrlByFileId] = useState(
    {}
  );
  const [weatherByPlaceId, setWeatherByPlaceId] = useState({});
  const sourcePlanText = String(planResponseText || responseText || "");

  const sections = useMemo(
    () => parseMarkdownSections(sourcePlanText),
    [sourcePlanText]
  );

  const days = useMemo(() => extractDays(sections), [sections]);
  const budgetItems = useMemo(() => extractBudgetItems(sections), [sections]);
  const destinationHints = useMemo(
    () => extractDestinationHints(sourcePlanText),
    [sourcePlanText]
  );

  const timelineStops = useMemo(() => {
    const base = days.length
      ? days.map((item, index) => ({
          day: Number(item.day) || index + 1,
          text: item.text,
        }))
      : sections
          .flatMap((section) => String(section.content || "").split("\n"))
          .map((line) => line.trim())
          .filter((line) => line.length > 12)
          .slice(0, 12);

    if (!base.length) {
      const defaultPlace = destinationHints[0] || "Trip destination";
      const fallbackMapUrl = buildGoogleMapsLink(
        defaultPlace,
        defaultPlace,
        "Trip destination"
      );
      return [
        {
          id: "stop_0",
          dayNumber: 1,
          label: "Day 01",
          headline: "Plan summary",
          photoKey: "stop_0",
          text: "No itinerary lines found yet. Generate a detailed day-by-day plan to see the full timeline.",
          detail: buildDetailedTimelineText(
            "No itinerary lines found yet. Generate a detailed day-by-day plan to see the full timeline.",
            defaultPlace,
            "Day 01"
          ),
          place: defaultPlace,
          destinationHint: defaultPlace,
          mapUrl: fallbackMapUrl,
          streetViewUrl: `${fallbackMapUrl}&layer=c`,
          placesToVisit: [
            {
              id: "stop_0_place_0",
              name: defaultPlace,
              mapUrl: fallbackMapUrl,
            },
          ],
          placeVisitDetails: [
            {
              id: "place_detail_0_trip_destination",
              name: defaultPlace,
              category: "Attraction",
              bestTime: "Anytime",
              duration: "1-2 hours",
              summary:
                "Add concrete day-by-day itinerary lines to unlock detailed places and practical visit guidance.",
              tip: "Refresh the trip plan with specific stops to improve this section.",
              mapUrl: fallbackMapUrl,
              streetViewUrl: `${fallbackMapUrl}&layer=c`,
              order: 1,
            },
          ],
          imageUrl: buildPlaceImageLink(defaultPlace, defaultPlace),
          fallbackImageUrl: buildPlaceFallbackImageLink("trip_destination"),
        },
      ];
    }

    return base.map((item, index) => {
      const text = typeof item === "string" ? item : item.text;
      const dayNumber =
        typeof item === "string" ? index + 1 : Number(item.day) || index + 1;
      const dayLabel = `Day ${String(dayNumber).padStart(2, "0")}`;
      const place = inferPlaceName(text, destinationHints);
      const destinationHint = destinationHints[0] || place;
      const placesToVisit = extractPlacesFromTimelineText(text, [
        place,
        destinationHint,
      ]).slice(0, 4);
      const placeVisitDetails = buildPlaceVisitDetails({
        dayText: text,
        places: placesToVisit,
        dayLabel,
        destinationHint,
      });
      const primaryPlace = placesToVisit[0] || place;
      const mapUrl = buildGoogleMapsLink(primaryPlace, destinationHint, text);
      return {
        id: `stop_${index}`,
        dayNumber,
        label: dayLabel,
        headline: buildTimelineHeadline(text, place, index),
        photoKey: `${index}_${place}_${text}`.toLowerCase(),
        text,
        detail: buildDetailedTimelineText(text, place, dayLabel),
        place,
        destinationHint,
        mapUrl,
        streetViewUrl: `${mapUrl}&layer=c`,
        placesToVisit: placesToVisit.map((placeName, placeIndex) => ({
          id: `stop_${index}_place_${placeIndex}`,
          name: placeName,
          mapUrl: buildGoogleMapsLink(placeName, destinationHint, text),
        })),
        placeVisitDetails,
        imageUrl: buildPlaceImageLink(place, destinationHint),
        fallbackImageUrl: buildPlaceFallbackImageLink(`${place}_${index}`),
      };
    });
  }, [days, sections, destinationHints]);

  const timelineDayTabs = useMemo(() => {
    return timelineStops.map((stop) => ({
      id: stop.id,
      label: stop.label,
    }));
  }, [timelineStops]);

  useEffect(() => {
    if (!timelineDayTabs.length) {
      setActiveTimelineDayId("");
      return;
    }

    const hasActiveDay = timelineDayTabs.some(
      (item) => item.id === activeTimelineDayId
    );
    if (!hasActiveDay) {
      setActiveTimelineDayId(timelineDayTabs[0].id);
    }
  }, [timelineDayTabs, activeTimelineDayId]);

  const featuredTimelineStop = useMemo(() => {
    return (
      timelineStops.find((stop) => stop.id === activeTimelineDayId) ||
      timelineStops[0] ||
      null
    );
  }, [timelineStops, activeTimelineDayId]);

  const featuredPlaceDetails = useMemo(() => {
    if (!featuredTimelineStop) return [];
    if (Array.isArray(featuredTimelineStop.placeVisitDetails)) {
      return featuredTimelineStop.placeVisitDetails.slice(0, 6);
    }
    const fallbackPlaces = Array.isArray(featuredTimelineStop.placesToVisit)
      ? featuredTimelineStop.placesToVisit.map((spot) => spot.name)
      : [];
    return buildPlaceVisitDetails({
      dayText: featuredTimelineStop.text,
      places: fallbackPlaces,
      dayLabel: featuredTimelineStop.label,
      destinationHint: featuredTimelineStop.destinationHint,
    }).slice(0, 6);
  }, [featuredTimelineStop]);

  const featuredDayWeatherFallback = useMemo(
    () => inferApproxWeatherFromText(featuredTimelineStop?.text || ""),
    [featuredTimelineStop?.text]
  );

  useEffect(() => {
    let cancelled = false;
    const unresolvedPlaces = featuredPlaceDetails.filter(
      (spot) => !weatherByPlaceId[spot.id]
    );

    if (!unresolvedPlaces.length) {
      return () => {
        cancelled = true;
      };
    }

    Promise.all(
      unresolvedPlaces.map(async (spot) => {
        const weather = await resolveApproxWeather({
          placeName: spot.name,
          destinationHint:
            featuredTimelineStop?.destinationHint || featuredTimelineStop?.place || "",
          dayText: featuredTimelineStop?.text || "",
        });
        return {
          placeId: spot.id,
          weather,
        };
      })
    ).then((results) => {
      if (cancelled) return;
      setWeatherByPlaceId((prev) => {
        const next = { ...prev };
        for (const result of results) {
          next[result.placeId] = result.weather || featuredDayWeatherFallback;
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [
    featuredPlaceDetails,
    featuredTimelineStop?.destinationHint,
    featuredTimelineStop?.place,
    featuredTimelineStop?.text,
    weatherByPlaceId,
    featuredDayWeatherFallback,
  ]);

  useEffect(() => {
    if (memoryDayLabel.trim()) return;
    setMemoryDayLabel(featuredTimelineStop?.label || "Day 01");
  }, [featuredTimelineStop, memoryDayLabel]);

  const unresolvedPhotoCount = useMemo(
    () =>
      timelineStops.filter((stop) => !photoResolutionByStop[stop.photoKey])
        .length,
    [timelineStops, photoResolutionByStop]
  );
  const isResolvingPhotos = unresolvedPhotoCount > 0;

  useEffect(() => {
    let isCancelled = false;
    const unresolvedStops = timelineStops.filter(
      (stop) => !photoResolutionByStop[stop.photoKey]
    );

    if (!unresolvedStops.length) {
      return () => {
        isCancelled = true;
      };
    }

    Promise.all(
      unresolvedStops.map(async (stop) => {
        const wikiImage = await resolveWikipediaPhoto({
          placeName: stop.place,
          destinationHint: stop.destinationHint,
          timelineText: stop.text,
        });
        return {
          photoKey: stop.photoKey,
          imageUrl: wikiImage,
        };
      })
    ).then((resolved) => {
      if (isCancelled) return;
      setPhotoResolutionByStop((prev) => {
        const next = { ...prev };
        for (const result of resolved) {
          next[result.photoKey] = {
            status: result.imageUrl ? "resolved" : "fallback",
            imageUrl: result.imageUrl || "",
          };
        }
        return next;
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [timelineStops, photoResolutionByStop]);

  const selectedMemoryBytes = useMemo(
    () =>
      selectedMemoryFiles.reduce(
        (total, item) => total + Number(item?.file?.size || 0),
        0
      ),
    [selectedMemoryFiles]
  );

  const loadMemories = useCallback(async () => {
    if (!token) return;

    setMemoriesLoading(true);
    setMemoriesError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/history/memories`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to load saved memories");
      }

      const nextMemories = Array.isArray(payload?.data)
        ? payload.data
            .map((item) => normalizeMemoryRecord(item))
            .filter(Boolean)
        : [];
      setMemories(nextMemories);
    } catch (error) {
      setMemoriesError(error.message || "Unable to load memories");
    } finally {
      setMemoriesLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (active !== "memories") return;
    loadMemories();
  }, [active, loadMemories]);

  useEffect(() => {
    return () => {
      Object.values(driveImageBlobUrlByFileId).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [driveImageBlobUrlByFileId]);

  const requestDriveAccessToken = useCallback(
    async ({ forcePrompt = false } = {}) => {
      if (!GOOGLE_CLIENT_ID) {
        throw new Error("Missing VITE_GOOGLE_CLIENT_ID in frontend env");
      }

      const google = await loadGoogleIdentityScript();
      if (!google?.accounts?.oauth2?.initTokenClient) {
        throw new Error("Google OAuth client is unavailable");
      }

      return new Promise((resolve, reject) => {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: GOOGLE_DRIVE_SCOPE,
          callback: (tokenResponse) => {
            if (tokenResponse?.error) {
              reject(
                new Error(
                  tokenResponse.error_description ||
                    tokenResponse.error ||
                    "Google Drive authorization failed"
                )
              );
              return;
            }

            if (!tokenResponse?.access_token) {
              reject(new Error("Google Drive token was not returned"));
              return;
            }

            setDriveConnected(true);
            setDriveStatus("Google Drive connected.");
            resolve(tokenResponse.access_token);
          },
        });

        tokenClient.requestAccessToken({
          prompt: forcePrompt ? "consent" : "",
        });
      });
    },
    []
  );

  const connectDrive = useCallback(async () => {
    setMemoriesError("");
    setDriveStatus("Requesting Google Drive access...");
    try {
      await requestDriveAccessToken({ forcePrompt: true });
      setDriveConnected(true);
      setDriveStatus("Google Drive connected.");
    } catch (error) {
      setDriveConnected(false);
      setDriveStatus("Google Drive not connected");
      setMemoriesError(error.message || "Unable to connect Google Drive");
    }
  }, [requestDriveAccessToken]);

  useEffect(() => {
    let cancelled = false;

    const resolveDriveImages = async () => {
      if (active !== "memories" || !memories.length) return;

      const missingFileIds = memories
        .map((memory) => String(memory.driveFileId || "").trim())
        .filter(Boolean)
        .filter((fileId) => !driveImageBlobUrlByFileId[fileId]);

      if (!missingFileIds.length) return;
      if (!driveConnected) return;

      try {
        const accessToken = await requestDriveAccessToken({
          forcePrompt: false,
        });
        const resolvedEntries = [];

        for (const fileId of missingFileIds) {
          try {
            const objectUrl = await fetchDriveImageBlobUrl(accessToken, fileId);
            resolvedEntries.push({ fileId, objectUrl });
          } catch {
            // Some files may already be publicly accessible through URL candidates.
          }
        }

        if (cancelled || !resolvedEntries.length) return;

        setDriveImageBlobUrlByFileId((prev) => {
          const next = { ...prev };
          for (const entry of resolvedEntries) {
            if (next[entry.fileId]) {
              URL.revokeObjectURL(entry.objectUrl);
              continue;
            }
            next[entry.fileId] = entry.objectUrl;
          }
          return next;
        });
      } catch {
        // Silent fallback: gallery still attempts public URL candidates.
      }
    };

    resolveDriveImages();

    return () => {
      cancelled = true;
    };
  }, [
    active,
    memories,
    driveConnected,
    driveImageBlobUrlByFileId,
    requestDriveAccessToken,
  ]);

  const handleMemoryFileSelection = useCallback(async (event) => {
    const files = Array.from(event.target.files || [])
      .filter((file) => String(file.type || "").startsWith("image/"))
      .slice(0, 10);

    if (!files.length) {
      if (event.target) event.target.value = "";
      return;
    }

    setMemoriesError("");
    try {
      const prepared = await Promise.all(
        files.map(async (file, index) => ({
          id: `${file.name}_${file.lastModified}_${Date.now()}_${index}`,
          file,
          previewUrl: await fileToDataUrl(file),
        }))
      );
      setSelectedMemoryFiles((prev) => [...prev, ...prepared].slice(0, 14));
      setDriveStatus(`${prepared.length} image(s) ready for Google Drive upload.`);
    } catch (error) {
      setMemoriesError(error.message || "Failed to read selected images");
    } finally {
      if (event.target) event.target.value = "";
    }
  }, []);

  const removePendingMemory = useCallback((memoryId) => {
    setSelectedMemoryFiles((prev) =>
      prev.filter((item) => item.id !== memoryId)
    );
  }, []);

  const saveMemoriesToGoogleDrive = useCallback(async () => {
    if (!selectedMemoryFiles.length) {
      setMemoriesError("Select at least one image first.");
      return;
    }
    if (!token) {
      setMemoriesError("Sign in is required to save memories.");
      return;
    }

    setIsSavingMemories(true);
    setMemoriesError("");
    setDriveStatus("Preparing Google Drive upload...");

    try {
      const accessToken = await requestDriveAccessToken();
      const rootFolderId = await findOrCreateDriveFolder(
        accessToken,
        DRIVE_ROOT_FOLDER_NAME
      );

      const folderName =
        memoryDayLabel.trim() || featuredTimelineStop?.label || "General";
      const dayFolderId = await findOrCreateDriveFolder(
        accessToken,
        folderName,
        rootFolderId
      );

      for (let index = 0; index < selectedMemoryFiles.length; index += 1) {
        const pending = selectedMemoryFiles[index];
        const file = pending.file;
        setDriveStatus(
          `Uploading ${index + 1}/${
            selectedMemoryFiles.length
          } to Google Drive...`
        );

        const uploadResult = await uploadImageToDrive(accessToken, file, {
          folderId: dayFolderId,
          name: buildMemoryUploadName(file.name, folderName, index),
        });

        try {
          await makeDriveFilePublic(accessToken, uploadResult.id);
        } catch {
          // Keep memory save flow alive even if sharing permission fails.
        }

        const publicImageUrl = uploadResult?.id
          ? `https://lh3.googleusercontent.com/d/${encodeURIComponent(
              uploadResult.id
            )}=w1600`
          : "";

        const response = await fetch(`${API_BASE_URL}/api/v1/history/memories`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: `Memory ${String(index + 1).padStart(2, "0")} · ${folderName}`,
            detail: buildMemoryDetail(memoryCaption, folderName, file.name),
            image: publicImageUrl,
            dayLabel: folderName,
            tags: uniqueTextList([
              folderName,
              featuredTimelineStop?.place,
              "trip memory",
            ]),
            driveFileId: uploadResult?.id || "",
            driveWebViewLink: uploadResult?.webViewLink || "",
            driveDownloadLink: uploadResult?.webContentLink || "",
            driveThumbnailLink: uploadResult?.thumbnailLink || publicImageUrl,
            drivePublicImageUrl: publicImageUrl,
          }),
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.message || "Failed to save memory metadata");
        }
      }

      setSelectedMemoryFiles([]);
      setMemoryCaption("");
      setDriveStatus(`Saved ${selectedMemoryFiles.length} image(s) to Google Drive.`);
      await loadMemories();
    } catch (error) {
      setMemoriesError(error.message || "Unable to save memories");
      setDriveStatus("Google Drive upload failed");
    } finally {
      setIsSavingMemories(false);
    }
  }, [
    selectedMemoryFiles,
    token,
    requestDriveAccessToken,
    memoryDayLabel,
    featuredTimelineStop,
    memoryCaption,
    loadMemories,
  ]);

  const canSaveMemories =
    Boolean(selectedMemoryFiles.length) && Boolean(token) && !isSavingMemories;

  const guideSafety = useMemo(
    () => toGuideList(guideCompanion?.safetyChecklist),
    [guideCompanion]
  );
  const guideEtiquette = useMemo(
    () => toGuideList(guideCompanion?.localEtiquette),
    [guideCompanion]
  );
  const guidePacking = useMemo(
    () => toGuideList(guideCompanion?.packingChecklist),
    [guideCompanion]
  );
  const guideMoney = useMemo(
    () => toGuideList(guideCompanion?.moneyTips),
    [guideCompanion]
  );
  const guideFoodMissions = useMemo(
    () => toGuideObjectList(guideCompanion?.foodMissions, ["dish", "whereToTry"]),
    [guideCompanion]
  );
  const guideBookingStrategy = useMemo(
    () =>
      toGuideObjectList(guideCompanion?.bookingStrategy, [
        "item",
        "why",
        "bestTime",
      ]),
    [guideCompanion]
  );
  const guideHiddenGems = useMemo(
    () =>
      toGuideObjectList(guideCompanion?.hiddenGems, [
        "name",
        "whyVisit",
        "mapUrl",
      ]),
    [guideCompanion]
  );

  const canShow = Boolean(sourcePlanText.trim());

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <ResponsePlanSidebar
        active={active}
        onChangeActive={setActive}
        timelineStops={timelineStops}
        title={title}
        subtitle={subtitle}
        onRefresh={onRefresh}
        lastPlanAt={lastPlanAt}
        formatTimestamp={formatTimestamp}
      />

      <section className="lg:col-span-9">
        {isLoading ? (
          <ResponsePlanEmptyState
            title="Loading trip dashboard..."
            subtitle="Fetching your latest saved trip plan."
          />
        ) : !canShow ? (
          <ResponsePlanEmptyState
            title="No AI response yet"
            subtitle="Generate a plan and the dashboard will turn it into an interactive view."
          />
        ) : (
          <div className="space-y-6">
            {loadError ? (
              <div className="rounded-2xl border border-[#e7c2b7] bg-[#fff2ef] px-4 py-3 text-xs font-semibold text-[#8b3f2d]">
                {loadError}
              </div>
            ) : null}

            <ResponsePlanHeaderCard sourcePlanText={sourcePlanText} />

            {active === "timeline" ? (
              <TimelineTab
                timelineStops={timelineStops}
                isResolvingPhotos={isResolvingPhotos}
                featuredTimelineStop={featuredTimelineStop}
                timelineDayTabs={timelineDayTabs}
                activeTimelineDayId={activeTimelineDayId}
                onSelectTimelineDay={setActiveTimelineDayId}
                photoResolutionByStop={photoResolutionByStop}
                featuredPlaceDetails={featuredPlaceDetails}
                weatherByPlaceId={weatherByPlaceId}
                featuredDayWeatherFallback={featuredDayWeatherFallback}
              />
            ) : null}

            {active === "guide" ? (
              <GuideTab
                guideLoading={guideLoading}
                guideError={guideError}
                guideCompanion={guideCompanion}
                guidePacking={guidePacking}
                guideFoodMissions={guideFoodMissions}
                guideMoney={guideMoney}
                guideSafety={guideSafety}
                guideEtiquette={guideEtiquette}
                guideBookingStrategy={guideBookingStrategy}
                guideHiddenGems={guideHiddenGems}
              />
            ) : null}

            {active === "wallet" ? <WalletTab budgetItems={budgetItems} /> : null}

            {active === "memories" ? (
              <MemoriesTab
                loadMemories={loadMemories}
                memoriesError={memoriesError}
                memoryFileInputRef={memoryFileInputRef}
                handleMemoryFileSelection={handleMemoryFileSelection}
                connectDrive={connectDrive}
                driveConnected={driveConnected}
                memoryDayLabel={memoryDayLabel}
                setMemoryDayLabel={setMemoryDayLabel}
                memoryCaption={memoryCaption}
                setMemoryCaption={setMemoryCaption}
                selectedMemoryFiles={selectedMemoryFiles}
                selectedMemoryBytes={selectedMemoryBytes}
                formatFileSize={formatFileSize}
                saveMemoriesToGoogleDrive={saveMemoriesToGoogleDrive}
                canSaveMemories={canSaveMemories}
                isSavingMemories={isSavingMemories}
                driveStatus={driveStatus}
                removePendingMemory={removePendingMemory}
                memoriesLoading={memoriesLoading}
                memories={memories}
                driveImageBlobUrlByFileId={driveImageBlobUrlByFileId}
                formatTimestamp={formatTimestamp}
                driveRootFolderName={DRIVE_ROOT_FOLDER_NAME}
              />
            ) : null}

            {active === "rightnow" ? (
              <RightNowTab
                token={token}
                user={user}
                rightNowContext={rightNowContext}
              />
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
