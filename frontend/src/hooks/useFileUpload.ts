import { useState, useCallback } from "react";
import { uploadReport } from "@/services/api";
import type { UploadResponse } from "@/types";
import type { AxiosError } from "axios";

interface UseFileUploadReturn {
  file: File | null;
  isUploading: boolean;
  success: boolean;
  error: string | null;
  response: UploadResponse | null;
  setFile: (file: File | null) => void;
  upload: () => Promise<void>;
  reset: () => void;
}

export function useFileUpload(): UseFileUploadReturn {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<UploadResponse | null>(null);

  const upload = useCallback(async () => {
    if (!file) return;

    setIsUploading(true);
    setSuccess(false);
    setError(null);
    setResponse(null);

    try {
      const result = await uploadReport(file);
      setResponse(result);

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.message || "Upload failed");
      }
    } catch (err) {
      const axiosError = err as AxiosError<UploadResponse>;
      const message =
        axiosError.response?.data?.message ||
        axiosError.message ||
        "An unexpected error occurred";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  }, [file]);

  const reset = useCallback(() => {
    setFile(null);
    setIsUploading(false);
    setSuccess(false);
    setError(null);
    setResponse(null);
  }, []);

  return {
    file,
    isUploading,
    success,
    error,
    response,
    setFile,
    upload,
    reset,
  };
}
