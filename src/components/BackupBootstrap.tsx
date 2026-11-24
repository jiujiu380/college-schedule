import { useEffect } from "react";
import { createSnapshot } from "../lib/backup-history";

export function BackupBootstrap() {
  useEffect(() => {
    void createSnapshot(false).catch(() => {});
  }, []);
  return null;
}
