export type DrivePhoto = {
  id: string;
  name: string;
  thumbnailLink?: string;
  webContentLink?: string;
  mimeType: string;
};

export async function listDriveImages(folderId: string): Promise<DrivePhoto[]> {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GOOGLE_DRIVE_API_KEY");
  }

  const params = new URLSearchParams({
    key: apiKey,
    q: `'${folderId}' in parents and mimeType contains 'image/' and trashed=false`,
    fields: "files(id,name,thumbnailLink,webContentLink,mimeType)",
    pageSize: "100",
  });

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error("Google Drive sync failed");
  }

  const data = (await response.json()) as { files?: DrivePhoto[] };
  return data.files || [];
}
