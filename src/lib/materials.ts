import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

const KEY = "college.materials.v1";

export type MaterialKind = "file" | "image" | "note";

export type Material = {
  id: string;
  courseId: string;
  kind: MaterialKind;
  name: string;
  uri?: string;
  mime?: string;
  text?: string;
  createdAt: number;
};

export async function loadMaterials(): Promise<Material[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function save(list: Material[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function addMaterial(item: Omit<Material, "id" | "createdAt">): Promise<Material[]> {
  const list = await loadMaterials();
  const next = [{ ...item, id: "mat-" + Date.now().toString(36), createdAt: Date.now() }, ...list];
  await save(next);
  return next;
}

export async function deleteMaterial(id: string): Promise<Material[]> {
  const list = await loadMaterials();
  const target = list.find((m) => m.id === id);
  if (target?.uri) await FileSystem.deleteAsync(target.uri, { idempotent: true }).catch(() => {});
  const next = list.filter((m) => m.id !== id);
  await save(next);
  return next;
}

export async function copyMaterialFile(sourceUri: string, name: string): Promise<string> {
  const dir = FileSystem.documentDirectory;
  if (!dir) throw new Error("没有可写的文档目录");
  const folder = dir + "materials/";
  await FileSystem.makeDirectoryAsync(folder, { intermediates: true }).catch(() => {});
  const safe = name.replace(/[\\/:*?"<>|]/g, "_");
  const target = folder + Date.now() + "-" + safe;
  await FileSystem.copyAsync({ from: sourceUri, to: target });
  return target;
}
