import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

import { createLocalImageItem, createServerImageItem } from '@utils/editorUtils';

import type { ImageItem } from '@mytypes/editorTypes';
import type { ImageResponse } from '@mytypes/responseTypes';

interface ImagesContextValue {
  files: ImageItem[];
  presentFiles: ImageItem[];
  findImageItem: (id: string) => ImageItem | undefined;
  addFiles: (files: File[]) => void;
  addLocalImageItems: (files: ImageItem[]) => void;
  addImageItems: (files: ImageResponse[]) => void;
  deleteFile: (id: string) => void;
  clearFiles: () => void;
  deleteFileTmp: (id: string) => void;
  restoreFile: (id: string) => void;
  replaceImageItems: (files: ImageResponse[], full?: boolean) => void;
}

export const ImagesContext = createContext<ImagesContextValue | null>(null);

export const ImagesContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [files, setFiles] = useState<ImageItem[]>([]);

  const findImageItem = useCallback((id: string) => files.find((f) => f.id === id), [files]);

  const addFiles = useCallback((newItems: File[]) => {
    if (!newItems) return;
    setFiles((prev) => [...prev, ...newItems.map(createLocalImageItem)]);
  }, []);

  const addLocalImageItems = useCallback((newItems: ImageItem[]) => {
    if (!newItems) return;
    setFiles((prev) => [...prev, ...newItems]);
  }, []);

  const addImageItems = useCallback((newItems: ImageResponse[]) => {
    if (!newItems) return;
    setFiles((prev) => [...prev, ...newItems.map(createServerImageItem)]);
  }, []);

  const setFilesWithCleanup = useCallback((cb: (prev: ImageItem[]) => ImageItem[]) => {
    setFiles((prev) => {
      const newItems = cb(prev);
      const newIds = newItems.map((f) => f.id);

      prev.forEach((f) => {
        if (!newIds.includes(f.id)) URL.revokeObjectURL(f.url);
      });
      return newItems;
    });
  }, []);

  const deleteFile = useCallback(
    (id: string) => {
      setFilesWithCleanup((prev) => prev.filter((f) => f.id !== id));
    },
    [setFilesWithCleanup],
  );

  const clearFiles = useCallback(() => {
    setFilesWithCleanup(() => []);
  }, [setFilesWithCleanup]);

  const setDeleted = useCallback((id: string, deleted: boolean) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, deleted } : f)));
  }, []);

  const deleteFileTmp = useCallback(
    (id: string) => {
      setDeleted(id, true);
    },
    [setDeleted],
  );

  const restoreFile = useCallback(
    (id: string) => {
      setDeleted(id, false);
    },
    [setDeleted],
  );

  const replaceImageItems = useCallback(
    (newItems: ImageResponse[], full: boolean = false) => {
      if (!newItems) return;
      if (full) {
        setFilesWithCleanup(() => newItems.map(createServerImageItem));
      } else {
        setFiles((prev) => {
          return [
            ...prev.map((f) => {
              const item = newItems.find((i) => i.id === f.id);

              if (!item) return f;
              URL.revokeObjectURL(f.url);
              return { ...createServerImageItem(item) };
            }),
            ...newItems
              .filter((i) => !prev.some((f) => f.id === i.id))
              .map((i) => createServerImageItem(i)),
          ];
        });
      }
    },
    [setFilesWithCleanup],
  );

  useEffect(() => {
    return () => {
      files.forEach((f) => {
        URL.revokeObjectURL(f.url);
      });
    };
  }, [files]);

  const presentFiles = useMemo(() => files.filter((f) => !f.deleted), [files]);

  const value = useMemo(
    () => ({
      files,
      presentFiles,
      findImageItem,
      addFiles,
      addLocalImageItems,
      addImageItems,
      deleteFile,
      clearFiles,
      deleteFileTmp,
      restoreFile,
      replaceImageItems,
    }),
    [
      files,
      presentFiles,
      findImageItem,
      addFiles,
      addLocalImageItems,
      addImageItems,
      deleteFile,
      clearFiles,
      deleteFileTmp,
      restoreFile,
      replaceImageItems,
    ],
  );

  return <ImagesContext.Provider value={value}>{children}</ImagesContext.Provider>;
};
