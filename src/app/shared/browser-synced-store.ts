import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, PLATFORM_ID, inject } from '@angular/core';

export abstract class BrowserSyncedStore<TSnapshot> {
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly browser = isPlatformBrowser(this.platformId);
  private channel: BroadcastChannel | null = null;
  private lastSerializedSnapshot: string | null = null;

  protected constructor(private readonly storageKey: string) {}

  protected initializeSync(): void {
    if (!this.browser) {
      return;
    }

    this.restoreFromStorage();

    if ('BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(this.storageKey);
      this.channel.addEventListener('message', this.handleChannelMessage);
    }

    window.addEventListener('storage', this.handleStorageEvent);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('storage', this.handleStorageEvent);
      this.channel?.removeEventListener('message', this.handleChannelMessage);
      this.channel?.close();
      this.channel = null;
    });
  }

  protected persistSnapshot(): void {
    if (!this.browser) {
      return;
    }

    const snapshot = this.createSnapshot();
    const serialized = JSON.stringify(snapshot);

    if (serialized === this.lastSerializedSnapshot) {
      return;
    }

    this.lastSerializedSnapshot = serialized;

    try {
      window.localStorage.setItem(this.storageKey, serialized);
    } catch {
      // Keep in-memory state usable even if persistent storage is unavailable.
    }

    this.channel?.postMessage(snapshot);
  }

  protected readNow(): number {
    return Date.now();
  }

  private restoreFromStorage(): void {
    try {
      const serialized = window.localStorage.getItem(this.storageKey);

      if (serialized === null) {
        return;
      }

      const snapshot = this.deserializeSnapshot(serialized);

      if (snapshot === null) {
        return;
      }

      this.applySnapshot(snapshot, serialized);
    } catch {
      // Ignore malformed or inaccessible persisted state.
    }
  }

  private readonly handleStorageEvent = (event: StorageEvent): void => {
    if (event.key !== this.storageKey || event.newValue === null) {
      return;
    }

    const snapshot = this.deserializeSnapshot(event.newValue);

    if (snapshot === null) {
      return;
    }

    this.applySnapshot(snapshot, event.newValue);
  };

  private readonly handleChannelMessage = (event: MessageEvent<unknown>): void => {
    const snapshot = this.normalizeSnapshot(event.data);

    if (snapshot === null) {
      return;
    }

    this.applySnapshot(snapshot);
  };

  private deserializeSnapshot(serialized: string): TSnapshot | null {
    try {
      return this.normalizeSnapshot(JSON.parse(serialized));
    } catch {
      return null;
    }
  }

  private applySnapshot(snapshot: TSnapshot, serialized?: string): void {
    const snapshotJson = serialized ?? JSON.stringify(snapshot);

    if (snapshotJson === this.lastSerializedSnapshot) {
      return;
    }

    this.lastSerializedSnapshot = snapshotJson;
    this.hydrateSnapshot(snapshot);
  }

  protected abstract createSnapshot(): TSnapshot;
  protected abstract normalizeSnapshot(value: unknown): TSnapshot | null;
  protected abstract hydrateSnapshot(snapshot: TSnapshot): void;
}
