import { google } from "googleapis";

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

function getDriveClient() {
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

async function createFolder(name: string, parentId: string) {
  const drive = getDriveClient();
  const response = await drive.files.create({
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

async function shareFolderWithLink(folderId: string) {
  const drive = getDriveClient();
  await drive.permissions.create({
    fileId: folderId,
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

export async function listDriveImages(folderId: string): Promise<DrivePhoto[]> {
  const drive = getDriveClient();
  const response = await drive.files.list({
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
