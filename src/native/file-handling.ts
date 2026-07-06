import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import { apiClient } from "../api/client";
import { getStoredAccessToken } from "../api/token-storage";
import type { StudentDocument } from "../features/student/types";

type NativeFile = {
  base64: string;
  fileName: string;
  mimeType: string;
  size?: number;
};

const cacheDirectory = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory}lcmp/`;

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

async function ensureCacheDirectory() {
  await FileSystem.makeDirectoryAsync(cacheDirectory, { intermediates: true });
}

export async function downloadCertificatePdf(certificateId: string, fileNameHint?: string) {
  await ensureCacheDirectory();
  const fileName = sanitizeFileName(fileNameHint || `certificate-${certificateId}.pdf`);
  const uri = `${cacheDirectory}${fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`}`;
  const token = await getStoredAccessToken();
  const response = await FileSystem.downloadAsync(`${apiClient.defaults.baseURL}/certificates/${certificateId}/download`, uri, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });
  if (response.status < 200 || response.status >= 300) {
    throw new Error("Certificate download failed. Please try again.");
  }
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  return uri;
}

export async function openNativeFile(uri: string) {
  const canOpen = await Linking.canOpenURL(uri);
  if (canOpen) {
    await Linking.openURL(uri);
    return;
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri);
  }
}

export async function shareNativeFile(uri: string) {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Native sharing is not available on this device.");
  }
  await Sharing.shareAsync(uri);
}

export async function pickDocumentFile(): Promise<NativeFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: ["application/pdf", "image/jpeg", "image/png", "image/webp"]
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
  return {
    base64,
    fileName: asset.name,
    mimeType: asset.mimeType ?? "application/octet-stream",
    size: asset.size
  };
}

export async function pickImageFromLibrary(): Promise<NativeFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library permission is required to upload an image.");
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: false,
    base64: true,
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.9
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  return {
    base64: asset.base64 ?? await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 }),
    fileName: asset.fileName ?? `document-${Date.now()}.jpg`,
    mimeType: asset.mimeType ?? "image/jpeg",
    size: asset.fileSize
  };
}

export async function captureDocumentImage(): Promise<NativeFile | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Camera permission is required to upload a document photo.");
  }
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: false,
    base64: true,
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.85
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  return {
    base64: asset.base64 ?? await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 }),
    fileName: asset.fileName ?? `document-${Date.now()}.jpg`,
    mimeType: asset.mimeType ?? "image/jpeg",
    size: asset.fileSize
  };
}

export function documentDownloadUnsupportedMessage(document: StudentDocument) {
  return `LCMP has metadata for ${document.fileName ?? "this document"}, but the backend does not expose a student document download endpoint yet.`;
}

export type { NativeFile };
