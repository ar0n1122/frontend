import { useCallback, useEffect, useRef, useState } from "react";
import { documentsApi } from "@/services/api";
import type { DocumentItem, DocumentStatus } from "@/types";
import { cachedFetch, invalidateCache } from "@/utils/fetchCache";

const DOCS_KEY = "documents";

export function useDocuments() {
  const [data, setData] = useState<DocumentItem[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const refetch = useCallback(async (force = false) => {
    if (force) invalidateCache(DOCS_KEY);
    setIsError(false);
    setIsFetching(true);
    try {
      const docs = await cachedFetch(DOCS_KEY, documentsApi.list);
      setData(docs);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, isError, isFetching, refetch };
}

export function useDeleteDocument() {
  const [isPending, setIsPending] = useState(false);
  const mutate = useCallback(
    async (id: string, opts?: { onSuccess?: () => void }) => {
      setIsPending(true);
      try {
        await documentsApi.delete(id);
        opts?.onSuccess?.();
      } finally {
        setIsPending(false);
      }
    },
    [],
  );
  return { mutate, isPending };
}

export function useReindexDocument() {
  const [isPending, setIsPending] = useState(false);
  const mutate = useCallback(
    async (id: string, opts?: { onSuccess?: () => void }) => {
      setIsPending(true);
      try {
        await documentsApi.reindex(id);
        opts?.onSuccess?.();
      } finally {
        setIsPending(false);
      }
    },
    [],
  );
  return { mutate, isPending };
}

export interface UploadingFile {
  file: File;
  progress: number;
  status: "uploading" | "processing" | "done" | "error";
  error?: string;
  documentId?: string;
}

const POLL_INTERVAL = 30_000;
const POLL_TIMEOUT = 60_000;
const TERMINAL_STATUSES: DocumentStatus[] = ["indexed", "failed"];

export function useUploadDocument(onRefresh?: () => void) {
  const [uploads, setUploads] = useState<Map<string, UploadingFile>>(new Map());
  const pollingRef = useRef<Map<string, ReturnType<typeof setInterval>>>(
    new Map(),
  );

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      pollingRef.current.forEach((id) => clearInterval(id));
      pollingRef.current.clear();
    };
  }, []);

  const startPolling = (key: string, documentId: string) => {
    if (pollingRef.current.has(key)) return;

    const startedAt = Date.now();

    const interval = setInterval(async () => {
      // Stop polling after timeout
      if (Date.now() - startedAt > POLL_TIMEOUT) {
        clearInterval(interval);
        pollingRef.current.delete(key);
        setUploads((prev) => {
          const next = new Map(prev);
          const entry = next.get(key);
          if (entry && entry.status === "processing") {
            next.set(key, {
              ...entry,
              status: "processing",
              error: "Still processing — use refresh to check status",
            });
          }
          return next;
        });
        return;
      }

      try {
        const doc = await documentsApi.get(documentId);
        if (TERMINAL_STATUSES.includes(doc.status)) {
          clearInterval(interval);
          pollingRef.current.delete(key);
          setUploads((prev) => {
            const next = new Map(prev);
            const entry = next.get(key);
            if (entry) {
              next.set(key, {
                ...entry,
                progress: 100,
                status: doc.status === "indexed" ? "done" : "error",
                error:
                  doc.status === "failed" ? "Processing failed" : undefined,
              });
            }
            return next;
          });
          onRefresh?.();
        } else if (doc.progress !== undefined && doc.progress !== null) {
          // Update progress from backend
          setUploads((prev) => {
            const next = new Map(prev);
            const entry = next.get(key);
            if (entry && entry.status === "processing") {
              next.set(key, { ...entry, progress: doc.progress ?? 0 });
            }
            return next;
          });
        }
      } catch {
        // If the doc isn't found yet, keep polling
      }
    }, POLL_INTERVAL);

    pollingRef.current.set(key, interval);
  };

  const uploadSingleFile = async (file: File) => {
    const key = `${file.name}-${file.size}`;
    setUploads((prev) => {
      const next = new Map(prev);
      next.set(key, { file, progress: 0, status: "uploading" });
      return next;
    });
    try {
      const result = await documentsApi.upload(file, (pct) => {
        setUploads((prev) => {
          const next = new Map(prev);
          const entry = next.get(key);
          if (entry) next.set(key, { ...entry, progress: pct });
          return next;
        });
      });

      // Upload returned — now in processing phase
      setUploads((prev) => {
        const next = new Map(prev);
        const entry = next.get(key);
        if (entry)
          next.set(key, {
            ...entry,
            progress: 0,
            status: "processing",
            documentId: result.document_id,
          });
        return next;
      });
      onRefresh?.();

      // If already indexed (sync pipeline), mark done immediately
      if (result.status === "indexed") {
        setUploads((prev) => {
          const next = new Map(prev);
          const entry = next.get(key);
          if (entry) next.set(key, { ...entry, status: "done" });
          return next;
        });
      } else {
        // Start polling for processing completion
        startPolling(key, result.document_id);
      }
    } catch (e) {
      setUploads((prev) => {
        const next = new Map(prev);
        const entry = next.get(key);
        if (entry)
          next.set(key, {
            ...entry,
            status: "error",
            error: e instanceof Error ? e.message : "Upload failed",
          });
        return next;
      });
    }
  };

  const uploadZipFile = async (file: File) => {
    const key = `${file.name}-${file.size}`;
    setUploads((prev) => {
      const next = new Map(prev);
      next.set(key, { file, progress: 0, status: "uploading" });
      return next;
    });
    try {
      const result = await documentsApi.uploadZip(file, (pct) => {
        setUploads((prev) => {
          const next = new Map(prev);
          const entry = next.get(key);
          if (entry) next.set(key, { ...entry, progress: pct });
          return next;
        });
      });

      // ZIP upload done — mark the zip entry as done and create entries for each PDF
      setUploads((prev) => {
        const next = new Map(prev);
        next.set(key, {
          file,
          progress: 100,
          status: "done",
          error: undefined,
        });

        // Add each extracted PDF as a separate processing entry
        for (const doc of result.documents) {
          const pdfKey = `${doc.filename}-${doc.document_id}`;
          const pdfFile = new File([], doc.filename, {
            type: "application/pdf",
          });
          next.set(pdfKey, {
            file: pdfFile,
            progress: 0,
            status: "processing",
            documentId: doc.document_id,
          });
        }
        return next;
      });
      onRefresh?.();

      // Start polling for each extracted PDF
      for (const doc of result.documents) {
        const pdfKey = `${doc.filename}-${doc.document_id}`;
        if (doc.status !== "indexed") {
          startPolling(pdfKey, doc.document_id);
        }
      }
    } catch (e) {
      setUploads((prev) => {
        const next = new Map(prev);
        const entry = next.get(key);
        if (entry)
          next.set(key, {
            ...entry,
            status: "error",
            error: e instanceof Error ? e.message : "Upload failed",
          });
        return next;
      });
    }
  };

  const uploadBatchFiles = async (pdfFiles: File[]) => {
    // Create a synthetic entry to track the batch upload progress
    const batchKey = `batch-${Date.now()}`;
    const batchFile = new File([], `${pdfFiles.length} PDF files`);
    setUploads((prev) => {
      const next = new Map(prev);
      next.set(batchKey, { file: batchFile, progress: 0, status: "uploading" });
      return next;
    });
    try {
      const result = await documentsApi.uploadBatch(pdfFiles, (pct) => {
        setUploads((prev) => {
          const next = new Map(prev);
          const entry = next.get(batchKey);
          if (entry) next.set(batchKey, { ...entry, progress: pct });
          return next;
        });
      });

      // Batch upload done — remove batch tracker, add individual PDF entries
      setUploads((prev) => {
        const next = new Map(prev);
        next.delete(batchKey);
        for (const doc of result.documents) {
          const pdfKey = `${doc.filename}-${doc.document_id}`;
          const pdfFile = new File([], doc.filename, {
            type: "application/pdf",
          });
          next.set(pdfKey, {
            file: pdfFile,
            progress: 0,
            status: "processing",
            documentId: doc.document_id,
          });
        }
        return next;
      });
      onRefresh?.();

      for (const doc of result.documents) {
        const pdfKey = `${doc.filename}-${doc.document_id}`;
        if (doc.status !== "indexed") {
          startPolling(pdfKey, doc.document_id);
        }
      }
    } catch (e) {
      setUploads((prev) => {
        const next = new Map(prev);
        const entry = next.get(batchKey);
        if (entry)
          next.set(batchKey, {
            ...entry,
            status: "error",
            error: e instanceof Error ? e.message : "Batch upload failed",
          });
        return next;
      });
    }
  };

  const MAX_BATCH_FILES = 10;
  const MAX_BATCH_SIZE = 50 * 1024 * 1024; // 50 MB

  const upload = async (files: File[]) => {
    const zipFiles = files.filter((f) => f.name.toLowerCase().endsWith(".zip"));
    const pdfFiles = files.filter(
      (f) => !f.name.toLowerCase().endsWith(".zip"),
    );

    // Handle ZIP files individually
    for (const file of zipFiles) {
      await uploadZipFile(file);
    }

    if (pdfFiles.length === 0) return;

    // Client-side validation for PDF batch
    if (pdfFiles.length > MAX_BATCH_FILES) {
      const errFile = new File([], `${pdfFiles.length} PDF files`);
      const errKey = `batch-err-${Date.now()}`;
      setUploads((prev) => {
        const next = new Map(prev);
        next.set(errKey, {
          file: errFile,
          progress: 0,
          status: "error",
          error: `Too many files (${pdfFiles.length}). Maximum allowed is ${MAX_BATCH_FILES}.`,
        });
        return next;
      });
      return;
    }

    const totalSize = pdfFiles.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_BATCH_SIZE) {
      const errFile = new File([], `${pdfFiles.length} PDF files`);
      const errKey = `batch-err-${Date.now()}`;
      setUploads((prev) => {
        const next = new Map(prev);
        next.set(errKey, {
          file: errFile,
          progress: 0,
          status: "error",
          error:
            "Total upload size exceeds the 50 MB limit. Please upload fewer or smaller files.",
        });
        return next;
      });
      return;
    }

    // Single PDF — use the original single-file endpoint
    if (pdfFiles.length === 1) {
      await uploadSingleFile(pdfFiles[0]);
    } else {
      await uploadBatchFiles(pdfFiles);
    }
  };

  const clearDone = () => {
    setUploads((prev) => {
      const next = new Map(prev);
      for (const [k, v] of next) {
        if (v.status === "done" || v.status === "error") {
          const interval = pollingRef.current.get(k);
          if (interval) {
            clearInterval(interval);
            pollingRef.current.delete(k);
          }
          next.delete(k);
        }
      }
      return next;
    });
  };

  const checkStatus = async (documentId: string) => {
    // Find the upload key for this document
    let foundKey: string | undefined;
    setUploads((prev) => {
      for (const [k, v] of prev) {
        if (v.documentId === documentId) {
          foundKey = k;
          break;
        }
      }
      return prev;
    });
    if (!foundKey) return;
    const key = foundKey;

    try {
      const doc = await documentsApi.get(documentId);
      if (TERMINAL_STATUSES.includes(doc.status)) {
        setUploads((prev) => {
          const next = new Map(prev);
          const e = next.get(key);
          if (e) {
            next.set(key, {
              ...e,
              progress: 100,
              status: doc.status === "indexed" ? "done" : "error",
              error: doc.status === "failed" ? "Processing failed" : undefined,
            });
          }
          return next;
        });
        onRefresh?.();
      } else {
        // Update progress and restart polling if still processing
        setUploads((prev) => {
          const next = new Map(prev);
          const e = next.get(key);
          if (e && e.status === "processing") {
            next.set(key, { ...e, progress: doc.progress ?? e.progress });
          }
          return next;
        });
        startPolling(key, documentId);
      }
    } catch {
      // ignore
    }
  };

  return {
    uploads: Array.from(uploads.values()),
    upload,
    clearDone,
    checkStatus,
  };
}
