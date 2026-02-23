/* Type declarations for optional expo packages (expo-document-picker, expo-image-picker, expo-web-browser).
 * Remove this file after running: pnpm add expo-document-picker expo-image-picker expo-web-browser
 */
declare module 'expo-document-picker' {
  export type DocumentPickerAsset = { uri: string; name: string | null; mimeType: string | null; size: number | null };
  export type DocumentPickerResult = { canceled: true } | { canceled: false; assets: DocumentPickerAsset[] };
  export function getDocumentAsync(options?: { type?: string | string[]; copyToCacheDirectory?: boolean }): Promise<DocumentPickerResult>;
}

declare module 'expo-image-picker' {
  export type ImagePickerAsset = { uri: string; fileName?: string | null; width?: number; height?: number };
  export type ImagePickerResult = { canceled: true } | { canceled: false; assets: ImagePickerAsset[] };
  export const MediaTypeOptions: { Images: 'images'; Videos: 'videos'; All: 'all' };
  export function launchImageLibraryAsync(options?: { mediaTypes?: string; allowsMultipleSelection?: boolean }): Promise<ImagePickerResult>;
}

declare module 'expo-web-browser' {
  export function openBrowserAsync(url: string, options?: object): Promise<{ type: string }>;
}
