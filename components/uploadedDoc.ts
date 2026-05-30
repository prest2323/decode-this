// Bridges the uploaded file's bytes from <Uploader> to <DocCanvas> so the canvas
// can render the REAL PDF (pdfjs needs the bytes; the DocumentModel doesn't carry
// them, and the shared store/contract is Preston's). Single-document app, so a
// module-level singleton is enough — set on upload, cleared on "new"/sample.
export interface UploadedFile {
  dataUrl: string;
  mime: string;
}

let current: UploadedFile | null = null;

export function setUploadedFile(dataUrl: string, mime: string): void {
  current = { dataUrl, mime };
}

export function getUploadedFile(): UploadedFile | null {
  return current;
}

export function clearUploadedFile(): void {
  current = null;
}
