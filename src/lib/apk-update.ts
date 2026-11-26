import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import { Platform } from "react-native";

export async function downloadAndInstallApk(url: string, onProgress: (ratio: number) => void): Promise<void> {
  if (Platform.OS !== "android") throw new Error("当前平台需要跳转到应用商店更新");
  if (!FileSystem.cacheDirectory) throw new Error("没有可写的缓存目录");
  const target = FileSystem.cacheDirectory + "zhiku-update.apk";
  await FileSystem.deleteAsync(target, { idempotent: true }).catch(() => {});

  const resumable = FileSystem.createDownloadResumable(url, target, {}, (p) => {
    if (p.totalBytesExpectedToWrite > 0) {
      onProgress(Math.min(1, p.totalBytesWritten / p.totalBytesExpectedToWrite));
    }
  });
  const result = await resumable.downloadAsync();
  if (!result?.uri) throw new Error("安装包下载失败，请检查网络后重试");

  const info = (await FileSystem.getInfoAsync(result.uri)) as { exists?: boolean; size?: number };
  if (!info.exists || (info.size ?? 0) < 1024 * 1024) {
    await FileSystem.deleteAsync(result.uri, { idempotent: true }).catch(() => {});
    throw new Error("安装包不完整，请稍后重试");
  }

  const contentUri = await FileSystem.getContentUriAsync(result.uri);
  await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
    data: contentUri,
    flags: 1,
    type: "application/vnd.android.package-archive",
  });
}