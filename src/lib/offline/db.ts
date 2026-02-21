import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Song, Setlist, SetlistSong } from '@/types/database';

interface SongbookDB extends DBSchema {
  songs: {
    key: string;
    value: Song;
  };
  setlists: {
    key: string;
    value: Setlist & { songs: (SetlistSong & { song: Song })[] };
  };
  meta: {
    key: string;
    value: { key: string; value: string };
  };
}

let dbPromise: Promise<IDBPDatabase<SongbookDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<SongbookDB>('songbook-offline', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('songs')) {
          db.createObjectStore('songs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('setlists')) {
          db.createObjectStore('setlists', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

export async function cacheSetlistWithSongs(
  setlist: Setlist,
  songs: (SetlistSong & { song: Song })[],
) {
  const db = await getDB();
  const tx = db.transaction(['setlists', 'songs'], 'readwrite');

  await tx.objectStore('setlists').put({ ...setlist, songs });

  for (const entry of songs) {
    await tx.objectStore('songs').put(entry.song);
  }

  await tx.done;
}

export async function getCachedSetlists() {
  const db = await getDB();
  return db.getAll('setlists');
}

export async function getCachedSetlist(id: string) {
  const db = await getDB();
  return db.get('setlists', id);
}

export async function getCachedSong(id: string) {
  const db = await getDB();
  return db.get('songs', id);
}

export async function getCachedSongs() {
  const db = await getDB();
  return db.getAll('songs');
}

export async function setMeta(key: string, value: string) {
  const db = await getDB();
  await db.put('meta', { key, value });
}

export async function getMeta(key: string) {
  const db = await getDB();
  const entry = await db.get('meta', key);
  return entry?.value ?? null;
}

export async function clearOfflineData() {
  const db = await getDB();
  const tx = db.transaction(['setlists', 'songs', 'meta'], 'readwrite');
  await tx.objectStore('setlists').clear();
  await tx.objectStore('songs').clear();
  await tx.objectStore('meta').clear();
  await tx.done;
}
