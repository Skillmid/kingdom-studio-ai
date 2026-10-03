import type { ExportFormat } from "../types/render";

export interface ExportDownloadItem {
  title?: string;
  format: ExportFormat;
  serializedPackage: string;
}

export interface ExportDownloadEnvironment {
  createObjectURL(blob: Blob): string;
  clickDownload(url: string, fileName: string): void;
  defer(callback: () => void): void;
  revokeObjectURL(url: string): void;
}

const browserEnvironment: ExportDownloadEnvironment = {
  createObjectURL: (blob) => URL.createObjectURL(blob),
  clickDownload: (url, fileName) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
  },
  defer: (callback) => {
    window.setTimeout(callback, 0);
  },
  revokeObjectURL: (url) => URL.revokeObjectURL(url),
};

export function downloadExportPackage(
  item: ExportDownloadItem,
  environment: ExportDownloadEnvironment = browserEnvironment,
): void {
  const extension = item.format === "edit-decision-list" ? "edl" : "json";
  const type = item.format === "edit-decision-list" ? "text/plain" : "application/json";
  const fileName = `${(item.title || "kingdom-studio-export").replace(/[^a-z0-9-_]+/gi, "-")}.${extension}`;
  const blobUrl = environment.createObjectURL(new Blob([item.serializedPackage], { type }));

  try {
    environment.clickDownload(blobUrl, fileName);
  } finally {
    environment.defer(() => environment.revokeObjectURL(blobUrl));
  }
}
