import { google } from "googleapis";
import type { drive_v3 } from "googleapis";
import { Readable } from "node:stream";

export type DrivePhoto = {
  id: string;
  name: string;
  thumbnailLink?: string;
  largeThumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  mimeType: string;
};

export type CustomerDriveFolders = {
  rootFolderId: string;
  rawFolderId: string;
  editedFolderId: string;
  rootFolderUrl: string;
  rawFolderUrl: string;
  editedFolderUrl: string;
};

const folderMimeType = "application/vnd.google-apps.folder";

function getPrivateKey() {
  return process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, "\n");
}

export function getDriveClient() {
  const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google Drive service account credentials");
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return google.drive({ version: "v3", auth });
}

function driveFolderUrl(folderId: string) {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

export function driveImageUrl(fileId: string, width: number) {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`;
}

function escapeDriveQuery(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function createFolder(name: string, parentId: string, drive: drive_v3.Drive = getDriveClient()) {
  const response = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name,
      mimeType: folderMimeType,
      parents: [parentId],
    },
    fields: "id, webViewLink",
  });

  if (!response.data.id) {
    throw new Error(`Could not create Google Drive folder: ${name}`);
  }

  return response.data.id;
}

async function shareFolderWithLink(folderId: string, drive: drive_v3.Drive = getDriveClient()) {
  await drive.permissions.create({
    fileId: folderId,
    supportsAllDrives: true,
    requestBody: {
      type: "anyone",
      role: "reader",
    },
  });
}

export async function createCustomerDriveFolders(customerName: string): Promise<CustomerDriveFolders> {
  const parentFolderId = process.env.TLORA_DRIVE_ROOT_FOLDER_ID;

  if (!parentFolderId) {
    throw new Error("Missing TLORA_DRIVE_ROOT_FOLDER_ID");
  }

  const rootFolderId = await createFolder(customerName, parentFolderId);
  const rawFolderId = await createFolder("FILE GỐC", rootFolderId);
  const editedFolderId = await createFolder("FILE CHỈNH SỬA", rootFolderId);

  await Promise.all([
    shareFolderWithLink(rootFolderId),
    shareFolderWithLink(rawFolderId),
    shareFolderWithLink(editedFolderId),
  ]);

  return {
    rootFolderId,
    rawFolderId,
    editedFolderId,
    rootFolderUrl: driveFolderUrl(rootFolderId),
    rawFolderUrl: driveFolderUrl(rawFolderId),
    editedFolderUrl: driveFolderUrl(editedFolderId),
  };
}

export async function createCustomerDriveFoldersInStudioDrive(drive: drive_v3.Drive, parentFolderId: string, customerName: string): Promise<CustomerDriveFolders> {
  const rootFolderId = await createFolder(customerName, parentFolderId, drive);
  const rawFolderId = await createFolder("FILE GỐC", rootFolderId, drive);
  const editedFolderId = await createFolder("FILE CHỈNH SỬA", rootFolderId, drive);
  await Promise.all([shareFolderWithLink(rootFolderId, drive), shareFolderWithLink(rawFolderId, drive), shareFolderWithLink(editedFolderId, drive)]);

  return {
    rootFolderId,
    rawFolderId,
    editedFolderId,
    rootFolderUrl: driveFolderUrl(rootFolderId),
    rawFolderUrl: driveFolderUrl(rawFolderId),
    editedFolderUrl: driveFolderUrl(editedFolderId),
  };
}

export async function listDriveImages(folderId: string, drive: drive_v3.Drive = getDriveClient()): Promise<DrivePhoto[]> {
  const response = await drive.files.list({
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    q: `'${folderId}' in parents and mimeType contains 'image/' and trashed=false`,
    fields: "files(id,name,thumbnailLink,webViewLink,webContentLink,mimeType)",
    pageSize: 1000,
    orderBy: "name_natural",
  });

  return response.data.files?.map((file) => ({
    id: file.id || "",
    name: file.name || "Untitled",
    thumbnailLink: file.id ? driveImageUrl(file.id, 900) : file.thumbnailLink || undefined,
    largeThumbnailLink: file.id ? driveImageUrl(file.id, 2400) : file.thumbnailLink || undefined,
    webViewLink: file.webViewLink || undefined,
    webContentLink: file.webContentLink || undefined,
    mimeType: file.mimeType || "image/jpeg",
  })) || [];
}

export async function listPublicDriveImages(folderId: string): Promise<DrivePhoto[]> {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_DRIVE_API_KEY");
  }

  const files: DrivePhoto[] = [];
  let pageToken = "";

  do {
    const params = new URLSearchParams({
      key: apiKey,
      q: `'${escapeDriveQuery(folderId)}' in parents and mimeType contains 'image/' and trashed=false`,
      fields: "nextPageToken,files(id,name,thumbnailLink,webViewLink,webContentLink,mimeType)",
      pageSize: "1000",
      orderBy: "name_natural",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
      cache: "no-store",
    });
    const payload = await response.json() as {
      error?: { message?: string };
      nextPageToken?: string;
      files?: Array<{
        id?: string;
        name?: string;
        thumbnailLink?: string;
        webViewLink?: string;
        webContentLink?: string;
        mimeType?: string;
      }>;
    };

    if (!response.ok) {
      throw new Error(payload.error?.message || "Could not list public Google Drive folder");
    }

    files.push(...(payload.files || []).map((file) => ({
      id: file.id || "",
      name: file.name || "Untitled",
      thumbnailLink: file.id ? driveImageUrl(file.id, 900) : file.thumbnailLink || undefined,
      largeThumbnailLink: file.id ? driveImageUrl(file.id, 2400) : file.thumbnailLink || undefined,
      webViewLink: file.webViewLink || undefined,
      webContentLink: file.webContentLink || (file.id ? `https://drive.google.com/uc?export=download&id=${file.id}` : undefined),
      mimeType: file.mimeType || "image/jpeg",
    })));

    pageToken = payload.nextPageToken || "";
  } while (pageToken);

  return files;
}

export async function uploadDriveImage(folderId: string, fileName: string, buffer: Buffer, mimeType = "image/jpeg"): Promise<DrivePhoto> {
  const drive = getDriveClient();
  const existing = await drive.files.list({
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    q: `'${folderId}' in parents and name='${escapeDriveQuery(fileName)}' and trashed=false`,
    fields: "files(id,name,thumbnailLink,webViewLink,webContentLink,mimeType)",
    pageSize: 1,
  });
  const found = existing.data.files?.[0];
  if (found?.id) {
    return {
      id: found.id,
      name: found.name || fileName,
      thumbnailLink: driveImageUrl(found.id, 900),
      largeThumbnailLink: driveImageUrl(found.id, 2400),
      webViewLink: found.webViewLink || undefined,
      webContentLink: found.webContentLink || undefined,
      mimeType: found.mimeType || mimeType,
    };
  }

  const response = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: "id,name,thumbnailLink,webViewLink,webContentLink,mimeType",
  });

  if (!response.data.id) {
    throw new Error(`Could not upload Google Drive file: ${fileName}`);
  }

  return {
    id: response.data.id,
    name: response.data.name || fileName,
    thumbnailLink: driveImageUrl(response.data.id, 900),
    largeThumbnailLink: driveImageUrl(response.data.id, 2400),
    webViewLink: response.data.webViewLink || undefined,
    webContentLink: response.data.webContentLink || undefined,
    mimeType: response.data.mimeType || mimeType,
  };
}
