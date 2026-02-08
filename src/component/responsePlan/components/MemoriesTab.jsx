import React, { useState } from "react";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Cloud,
  FolderPlus,
  Link as LinkIcon,
  Loader2,
  RefreshCcw,
  UploadCloud,
} from "lucide-react";
import { Card, SectionHeader } from "../../../ui/primitives";
import { uniqueTextList } from "../responsePlanUtils";

function MemoryImage({ memory, resolvedBlobUrl = "" }) {
  const candidates = uniqueTextList(
    [
      resolvedBlobUrl,
      ...(Array.isArray(memory?.imageCandidates) ? memory.imageCandidates : []),
    ].filter(Boolean),
    12
  );

  const [candidateIndex, setCandidateIndex] = useState(0);

  const src = candidates[candidateIndex] || "";
  if (!src) {
    return (
      <div className="grid aspect-[4/3] w-full place-items-center bg-white text-[12px] text-[#6a7b84]">
        No preview available
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={memory?.title || "Memory image"}
      loading="lazy"
      className="aspect-[4/3] w-full object-cover"
      onError={() => {
        setCandidateIndex((prev) =>
          prev + 1 < candidates.length ? prev + 1 : prev
        );
      }}
    />
  );
}

export default function MemoriesTab({
  loadMemories,
  memoriesError,
  memoryFileInputRef,
  handleMemoryFileSelection,
  connectDrive,
  driveConnected,
  memoryDayLabel,
  setMemoryDayLabel,
  memoryCaption,
  setMemoryCaption,
  selectedMemoryFiles,
  selectedMemoryBytes,
  formatFileSize,
  saveMemoriesToGoogleDrive,
  canSaveMemories,
  isSavingMemories,
  driveStatus,
  removePendingMemory,
  memoriesLoading,
  memories,
  driveImageBlobUrlByFileId,
  formatTimestamp,
  driveRootFolderName,
}) {
  return (
    <Card>
      <SectionHeader
        icon={<Camera className="h-5 w-5" />}
        title="Memories"
        subtitle="Save selected images into Google Drive day folders and keep an indexed memory timeline."
        right={
          <button
            type="button"
            onClick={loadMemories}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[#2f4954] transition hover:border-[var(--line-strong)] hover:bg-[#fff8eb]"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Refresh Memories
          </button>
        }
      />

      {memoriesError ? (
        <div className="rounded-2xl border border-[#e7c2b7] bg-[#fff2ef] px-4 py-3 text-xs font-semibold text-[#8b3f2d]">
          {memoriesError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-[22px] border border-[#e8dcc8] bg-[#fffaf1] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[12px] font-bold text-[#2f4954]">
                Save To Google Drive
              </div>
              <div
                className={[
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold",
                  driveConnected
                    ? "bg-[#e5f5ef] text-[#1f6f5a]"
                    : "bg-[#fff2ef] text-[#8b3f2d]",
                ].join(" ")}
              >
                {driveConnected ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <AlertCircle className="h-3 w-3" />
                )}
                {driveConnected ? "Connected" : "Not connected"}
              </div>
            </div>

            <div className="mt-1 text-[12px] text-[#6a7b84]">
              Folder path format:{" "}
              <span className="font-semibold">
                {driveRootFolderName} / {memoryDayLabel || "Day-01"}
              </span>
            </div>

            <input
              ref={memoryFileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleMemoryFileSelection}
            />

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => memoryFileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[#fff8eb] px-3 py-1.5 text-xs font-semibold text-[#2f4954] transition hover:border-[var(--line-strong)] hover:bg-[#ffeecd]"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                Choose Images
              </button>
              <button
                type="button"
                onClick={connectDrive}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[#2f4954] transition hover:border-[var(--line-strong)] hover:bg-[#fff8eb]"
              >
                <FolderPlus className="h-3.5 w-3.5" />
                Connect Drive
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.11em] text-[#6a7b84]">
                  Day Label
                </div>
                <input
                  value={memoryDayLabel}
                  onChange={(event) => setMemoryDayLabel(event.target.value)}
                  placeholder="Day 01"
                  className="w-full rounded-xl border border-[#dfd1ba] bg-white px-3 py-2 text-[13px] text-[#2f4954] outline-none focus:border-[var(--line-strong)]"
                />
              </label>

              <label className="block">
                <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.11em] text-[#6a7b84]">
                  Memory Details
                </div>
                <textarea
                  value={memoryCaption}
                  onChange={(event) => setMemoryCaption(event.target.value)}
                  rows={3}
                  placeholder="Add context so each memory keeps useful planning intelligence."
                  className="w-full resize-y rounded-xl border border-[#dfd1ba] bg-white px-3 py-2 text-[13px] text-[#2f4954] outline-none focus:border-[var(--line-strong)]"
                />
              </label>
            </div>

            <div className="mt-3 text-[11px] text-[#5f7078]">
              {selectedMemoryFiles.length} file(s) selected ·{" "}
              {formatFileSize(selectedMemoryBytes)}
            </div>

            <button
              type="button"
              onClick={saveMemoriesToGoogleDrive}
              disabled={!canSaveMemories}
              className={[
                "mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition",
                canSaveMemories
                  ? "bg-gradient-to-r from-[#0d6a66] to-[#084744] text-white shadow-[0_10px_24px_rgba(12,95,92,0.28)] hover:brightness-105"
                  : "cursor-not-allowed bg-[#d9ccb8] text-[#7e7160]",
              ].join(" ")}
            >
              {isSavingMemories ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Cloud className="h-3.5 w-3.5" />
                  Save To Google Drive
                </>
              )}
            </button>

            <div className="mt-3 rounded-2xl border border-[#eadfcf] bg-white px-3 py-2 text-[11px] text-[#5d727c]">
              {driveStatus}
            </div>
          </div>

          {selectedMemoryFiles.length ? (
            <div className="rounded-[22px] border border-[#e8dcc8] bg-white p-4">
              <div className="text-[12px] font-bold text-[#2f4954]">
                Pending Uploads
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {selectedMemoryFiles.map((item) => (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-[16px] border border-[#eadfcf] bg-[#fffaf1]"
                  >
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="aspect-square w-full object-cover"
                    />
                    <div className="space-y-1 p-2">
                      <div className="truncate text-[11px] font-semibold text-[#2f4954]">
                        {item.file.name}
                      </div>
                      <div className="text-[10px] text-[#6a7b84]">
                        {formatFileSize(item.file.size)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removePendingMemory(item.id)}
                        className="rounded-full border border-[#eadfcf] bg-white px-2.5 py-1 text-[10px] font-bold text-[#2f4954] hover:bg-[#fff8eb]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-[22px] border border-[#e8dcc8] bg-white p-4">
            <div className="text-[12px] font-bold text-[#2f4954]">
              Memory Gallery
            </div>
            <div className="mt-1 text-[12px] text-[#6a7b84]">
              Saved images from Google Drive with longer notes and day tags.
            </div>

            {memoriesLoading ? (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#eadfcf] bg-[#fffaf1] px-3 py-1.5 text-xs font-semibold text-[#2f4954]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading memories...
              </div>
            ) : null}

            {!memoriesLoading && memories.length ? (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {memories.map((memory) => {
                  const resolvedBlobUrl =
                    driveImageBlobUrlByFileId[memory.driveFileId] || "";
                  return (
                    <div
                      key={memory.id}
                      className="overflow-hidden rounded-[18px] border border-[#ece2d4] bg-[#fffaf1]"
                    >
                      <MemoryImage
                        key={`${memory.id}_${resolvedBlobUrl}`}
                        memory={memory}
                        resolvedBlobUrl={resolvedBlobUrl}
                      />
                      <div className="space-y-2 p-3">
                        <div className="text-[12px] font-bold text-[#2f4954]">
                          {memory.title}
                        </div>
                        <div className="text-[12px] leading-relaxed text-[#556973]">
                          {memory.detail || "No additional details saved."}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {memory.dayLabel ? (
                            <span className="rounded-full border border-[#e5d7c3] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#2f4954]">
                              {memory.dayLabel}
                            </span>
                          ) : null}
                          <span className="rounded-full border border-[#e5d7c3] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#2f4954]">
                            {formatTimestamp(memory.createdAt)}
                          </span>
                        </div>
                        {memory.driveWebViewLink ? (
                          <a
                            href={memory.driveWebViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#e5d7c3] bg-white px-2.5 py-1 text-[10px] font-bold text-[#2f4954] hover:border-[#d9c5aa]"
                          >
                            <LinkIcon className="h-3 w-3" />
                            Open in Drive
                          </a>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {!memoriesLoading && !memories.length ? (
              <div className="mt-4 rounded-2xl border border-[#ece2d4] bg-[#fffaf1] px-3 py-2 text-[12px] text-[#6a7b84]">
                No saved memories yet. Upload images and click "Save To Google
                Drive".
              </div>
            ) : null}

            {driveConnected ? (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#ece2d4] bg-[#fffaf1] px-3 py-2">
                  <div className="text-[12px] font-semibold text-[#2f4954]">
                    Primary folder
                  </div>
                  <div className="text-[11px] text-[#5f7078]">
                    {driveRootFolderName}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
