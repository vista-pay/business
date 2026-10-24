"use client";
import { useRef, useState } from "react";
import { CheckIcon, FileIcon, InfoIcon, PlusIcon, UploadCloudIcon } from "./icons";
import { DocumentKey, KYB_DOCUMENTS, KybDocument, KybDraft, fileError, formatBytes } from "@/lib/kyb";
import { cn } from "@/lib/utils";

type Props = {
  documents: KybDraft["documents"];
  onUpload: (key: DocumentKey, file: File) => void;
  onRemove: (key: DocumentKey) => void;
};

export function StepDocuments({ documents, onUpload, onRemove }: Props) {
  const [error, setError] = useState<string | null>(null);

  function accept(key: DocumentKey, file: File | undefined) {
    if (!file) return;
    const problem = fileError(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    onUpload(key, file);
  }

  return (
    <>
      <h1 className="text-[22px] font-bold tracking-tight text-[#0F172A] sm:text-[26px]">Upload Business Documents</h1>
      <p className="mt-1.5 text-[15px] text-slate-600">
        Required registration documentation for identity &amp; regulatory verification.
      </p>

      <hr className="my-6 border-slate-200" />

      <div className="space-y-4">
        {KYB_DOCUMENTS.map((doc, i) => (
          <DocumentCard
            key={doc.key}
            index={i + 1}
            doc={doc}
            meta={documents[doc.key]}
            onAccept={(file) => accept(doc.key, file)}
            onRemove={() => onRemove(doc.key)}
          />
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <hr className="my-6 border-slate-200" />

      <p className="flex items-center gap-2 text-[13px] text-slate-500">
        <InfoIcon className="h-4 w-4 shrink-0" />
        <span>
          Supported formats: <span className="font-semibold text-[#0F172A]">PDF, JPG, PNG</span>. Max 10MB per file.
        </span>
      </p>
    </>
  );
}

type CardProps = {
  index: number;
  doc: KybDocument;
  meta?: { name: string; size: number; type: string };
  onAccept: (file: File | undefined) => void;
  onRemove: () => void;
};

function DocumentCard({ index, doc, meta, onAccept, onRemove }: CardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[15px] font-semibold text-[#0F172A]">
            {index}. {doc.title}
          </h3>
          <p className="text-[13px] text-slate-500">{doc.description}</p>
        </div>
        {meta && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[12px] font-semibold text-[#15803D]">
            <CheckIcon className="h-3.5 w-3.5" />
            Uploaded
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => {
          onAccept(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {meta ? (
        <div className="mt-3 flex items-center gap-3 rounded-lg bg-[#F8FAFC] px-4 py-3">
          <FileIcon className="h-5 w-5 shrink-0 text-[#EF4444]" />
          <span className="flex-1 truncate text-[15px] text-[#0F172A]">{meta.name}</span>
          <span className="hidden text-[13px] text-slate-400 sm:inline">{formatBytes(meta.size)}</span>
          <button type="button" onClick={onRemove} className="text-[15px] font-semibold text-[#DC2626] hover:underline">
            Remove
          </button>
        </div>
      ) : doc.required ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            onAccept(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "mt-3 flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 transition-colors",
            dragging ? "border-[#2563EB] bg-[#EFF6FF]" : "border-[#2563EB]/40 bg-white"
          )}
        >
          <UploadCloudIcon className="h-6 w-6 text-[#2563EB]" />
          <p className="text-[15px] text-slate-600">
            Drag &amp; drop files here or{" "}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-semibold text-[#2563EB] underline underline-offset-4"
            >
              Browse files
            </button>
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-[#F8FAFC] px-4 py-3 text-[15px] text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-100"
        >
          <PlusIcon className="h-4 w-4" />
          Upload Document
        </button>
      )}
    </section>
  );
}
