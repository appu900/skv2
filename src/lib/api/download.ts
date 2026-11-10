"use client";

import { toast } from "sonner";
import { api, getErrorMessage } from "./client";

// Downloads a generated file (PDF / Excel) from the backend; errors come back as JSON inside the blob.
export async function downloadFile(path: string, filename: string, init: { method?: "GET" | "POST"; body?: unknown } = {}) {
  try {
    const response = await api.request({ url: path, method: init.method ?? "GET", data: init.body, responseType: "blob" });
    const url = URL.createObjectURL(response.data as Blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  } catch (error) {
    const blob = (error as { response?: { data?: Blob } }).response?.data;
    if (blob instanceof Blob) {
      try {
        toast.error(JSON.parse(await blob.text()).message ?? "Download failed");
        return;
      } catch {}
    }
    toast.error(getErrorMessage(error));
  }
}

// Opens a private ToA file through a short-lived signed link.
export async function openPrivateFile(endpoint: "/toa/tp/files" | "/toa/admin/files" | "/offline/admin/files", key: string) {
  try {
    const { data } = await api.get<{ data: { url: string } }>(endpoint, { params: { key } });
    window.open(data.data.url, "_blank", "noopener");
  } catch (error) {
    toast.error(getErrorMessage(error));
  }
}
