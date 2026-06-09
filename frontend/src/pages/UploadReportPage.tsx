import { useCallback, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ingestReport } from "@/services/api";
import type { IngestionResponse } from "@/types";
import { usePageTitle } from "@/hooks/usePageTitle";

const ACCEPTED_TYPES = ".xlsx,.xls";
const ACCEPTED_EXTENSIONS = ["xlsx", "xls"];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function UploadReportPage() {
  usePageTitle("Upload");

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<IngestionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setFile(null);
    setIsUploading(false);
    setResult(null);
    setError(null);
  }, []);

  const handleFileSelect = useCallback(
    (selectedFile: File) => {
      const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "";
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        setError("Invalid file type. Please upload .xlsx or .xls files.");
        return;
      }
      reset();
      setFile(selectedFile);
    },
    [reset]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFileSelect(droppedFile);
    },
    [handleFileSelect]
  );

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    setResult(null);
    try {
      const res = await ingestReport(file);
      if (res.success) {
        setResult(res);
      } else {
        setError(res.message || "Ingestion failed");
      }
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        axErr.response?.data?.message || axErr.message || "An unexpected error occurred"
      );
    } finally {
      setIsUploading(false);
    }
  }, [file]);

  return (
    <div className="flex items-start justify-center px-4 sm:px-6 py-8 sm:py-12">
      <div className="w-full max-w-lg space-y-5">
        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload & Ingest Report</CardTitle>
            <CardDescription>
              Upload a vessel noon report to parse and store it in the database.
              Accepted formats: XLSX, XLS.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drop Zone */}
            <div
              id="drop-zone"
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? "border-[hsl(210,70%,50%)] bg-[hsl(210,70%,50%)]/5 scale-[1.01]"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50"
              }`}
            >
              <div className={`size-12 rounded-xl flex items-center justify-center transition-all ${
                isDragOver ? "bg-[hsl(210,70%,50%)]/10 text-[hsl(210,70%,50%)]" : "bg-muted text-muted-foreground"
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-6">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{isDragOver ? "Drop file here" : "Drag & drop your file here"}</p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">.xlsx</span>
                <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">.xls</span>
              </div>
              <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES} onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
                e.target.value = "";
              }} className="hidden" id="file-input" />
            </div>

            {/* Selected File */}
            {file && (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
                <div className="size-9 rounded-md bg-[hsl(210,70%,50%)]/10 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-4 text-[hsl(210,70%,50%)]">
                    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); reset(); }}
                  className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
            )}

            <Button id="upload-button" className="w-full" size="lg" disabled={!file || isUploading} onClick={handleUpload}>
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <svg className="size-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : "Upload & Ingest Report"}
            </Button>
          </CardContent>
        </Card>

        {/* Success — Ingestion Results */}
        {result && (
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-emerald-400 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
                </svg>
                Ingestion Complete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-lg bg-background/60 p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{result.ingestion.inserted}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Inserted</p>
                </div>
                <div className="rounded-lg bg-background/60 p-3 text-center">
                  <p className="text-2xl font-bold text-amber-400">{result.ingestion.updated}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Updated</p>
                </div>
                <div className="rounded-lg bg-background/60 p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{result.ingestion.totalProcessed}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Processed</p>
                </div>
              </div>
              {result.parserInfo && (
                <div className="text-xs text-muted-foreground space-y-1 border-t border-border/50 pt-3">
                  <p>Sheet: <span className="text-foreground font-medium">{result.parserInfo.sheetName}</span></p>
                  <p>Columns Detected: <span className="text-foreground font-medium">{result.parserInfo.detectedReportColumns}</span></p>
                  <p>Parser: <span className="text-foreground font-medium">v{result.parserInfo.parserVersion}</span></p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
              <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
            <AlertTitle>Upload Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
