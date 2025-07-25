/**
 * Enhanced Local Storage Service
 * 
 * Advanced client-side storage capabilities with smart caching, offline support,
 * and data synchronization. Provides robust local storage management for forms,
 * user preferences, and application state.
 * Adapted from the old repository to work with modern TypeScript and React.
 */

// Enhanced Local Storage interfaces
export interface StorageItem<T = any> {
  key: string;
  value: T;
  timestamp: number;
  expiresAt?: number;
  version: string;
  metadata?: StorageMetadata;
}

export interface StorageMetadata {
  source: 'user_input' | 'api_response' | 'computed' | 'cached';
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  syncStatus: 'pending' | 'synced' | 'conflict' | 'error';
  lastSyncAttempt?: number;
  retryCount?: number;
}

export interface StorageConfig {
  maxSize: number; // in MB
  defaultTTL: number; // in milliseconds
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  syncEnabled: boolean;
  autoCleanup: boolean;
  debugMode: boolean;
}

export interface CacheStrategy {
  type: 'lru' | 'lfu' | 'ttl' | 'priority';
  maxItems: number;
  cleanupThreshold: number;
}

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  key: string;
  data: any;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  retryCount: number;
  lastError?: string;
}

export interface StorageStats {
  totalItems: number;
  totalSize: number; // in bytes
  availableSpace: number;
  hitRate: number;
  missRate: number;
  syncPendingCount: number;
  lastCleanup: number;
  performance: {
    averageReadTime: number;
    averageWriteTime: number;
    averageSyncTime: number;
  };
}

export interface FormCacheEntry {
  formId: string;
  formData: Record<string, any>;
  progress: number;
  lastModified: number;
  isComplete: boolean;
  validationErrors?: Record<string, string>;
  metadata: {
    sessionId?: string;
    userId?: string;
    formVersion?: string;
    autoSaved: boolean;
  };
}

/**
 * Enhanced Local Storage Service Class
 */
export class EnhancedLocalStorageService {
  private config: StorageConfig;
  private cacheStrategy: CacheStrategy;
  private syncQueue: SyncOperation[] = [];
  private stats: StorageStats;
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;

  constructor(config?: Partial<StorageConfig>) {
    this.config = {
      maxSize: 50, // 50MB default
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
      compressionEnabled: true,
      encryptionEnabled: false,
      syncEnabled: true,
      autoCleanup: true,
      debugMode: false,
      ...config
    };

    this.cacheStrategy = {
      type: 'lru',
      maxItems: 1000,
      cleanupThreshold: 0.8
    };

    this.stats = {
      totalItems: 0,
      totalSize: 0,
      availableSpace: 0,
      hitRate: 0,
      missRate: 0,
      syncPendingCount: 0,
      lastCleanup: 0,
      performance: {
        averageReadTime: 0,
        averageWriteTime: 0,
        averageSyncTime: 0
      }
    };

    this.initialize();
  }

  /**
   * Initialize the service
   */
  private initialize(): void {
    // Set up online/offline event listeners
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Load existing sync queue
    this.loadSyncQueue();

    // Set up periodic cleanup
    if (this.config.autoCleanup) {
      setInterval(() => {
        this.performCleanup();
      }, 60 * 60 * 1000); // Every hour
    }

    // Update stats
    this.updateStats();

    this.log('Enhanced Local Storage Service initialized');
  }

  /**
   * Store data with advanced options
   */
  async setItem<T>(
    key: string,
    value: T,
    options?: {
      ttl?: number;
      priority?: 'high' | 'medium' | 'low';
      tags?: string[];
      syncToServer?: boolean;
      compress?: boolean;
    }
  ): Promise<boolean> {
    const startTime = performance.now();

    try {
      // Check storage quota
      if (!this.hasSpaceAvailable()) {
        await this.performCleanup();
        
        if (!this.hasSpaceAvailable()) {
          throw new Error('Storage quota exceeded');
        }
      }

      // Prepare storage item
      const storageItem: StorageItem<T> = {
        key,
        value: options?.compress !== false && this.config.compressionEnabled 
          ? this.compress(value) 
          : value,
        timestamp: Date.now(),
        expiresAt: options?.ttl ? Date.now() + options.ttl : Date.now() + this.config.defaultTTL,
        version: '1.0',
        metadata: {
          source: 'user_input',
          priority: options?.priority || 'medium',
          tags: options?.tags || [],
          syncStatus: options?.syncToServer ? 'pending' : 'synced',
          retryCount: 0
        }
      };

      // Store in localStorage
      const serialized = JSON.stringify(storageItem);
      localStorage.setItem(this.getStorageKey(key), serialized);

      // Add to sync queue if needed
      if (options?.syncToServer && this.config.syncEnabled) {
        this.addToSyncQueue('create', key, value);
      }

      // Update stats
      const writeTime = performance.now() - startTime;
      this.updatePerformanceStats('write', writeTime);
      this.updateStats();

      this.log(`Stored item: ${key}`, { size: serialized.length, ttl: options?.ttl });
      return true;
    } catch (error) {
      console.error('Error storing item:', error);
      return false;
    }
  }

  /**
   * Retrieve data with automatic decompression and validation
   */
  async getItem<T>(key: string): Promise<T | null> {
    const startTime = performance.now();

    try {
      const storageKey = this.getStorageKey(key);
      const serialized = localStorage.getItem(storageKey);

      if (!serialized) {
        this.stats.missRate++;
        return null;
      }

      const storageItem: StorageItem<T> = JSON.parse(serialized);

      // Check expiration
      if (storageItem.expiresAt && Date.now() > storageItem.expiresAt) {
        localStorage.removeItem(storageKey);
        this.stats.missRate++;
        return null;
      }

      // Update access time for LRU
      storageItem.timestamp = Date.now();
      localStorage.setItem(storageKey, JSON.stringify(storageItem));

      // Decompress if needed
      const value = this.isCompressed(storageItem.value) 
        ? this.decompress(storageItem.value) 
        : storageItem.value;

      // Update stats
      const readTime = performance.now() - startTime;
      this.updatePerformanceStats('read', readTime);
      this.stats.hitRate++;

      this.log(`Retrieved item: ${key}`);
      return value;
    } catch (error) {
      console.error('Error retrieving item:', error);
      this.stats.missRate++;
      return null;
    }
  }

  /**
   * Remove item from storage
   */
  async removeItem(key: string, syncToServer = false): Promise<boolean> {
    try {
      const storageKey = this.getStorageKey(key);
      localStorage.removeItem(storageKey);

      // Add to sync queue if needed
      if (syncToServer && this.config.syncEnabled) {
        this.addToSyncQueue('delete', key, null);
      }

      this.updateStats();
      this.log(`Removed item: ${key}`);
      return true;
    } catch (error) {
      console.error('Error removing item:', error);
      return false;
    }
  }

  /**
   * Cache form data with progress tracking
   */
  async cacheFormData(
    formId: string,
    formData: Record<string, any>,
    progress: number,
    options?: {
      sessionId?: string;
      userId?: string;
      formVersion?: string;
      autoSave?: boolean;
    }
  ): Promise<boolean> {
    const cacheEntry: FormCacheEntry = {
      formId,
      formData,
      progress,
      lastModified: Date.now(),
      isComplete: progress >= 100,
      metadata: {
        sessionId: options?.sessionId,
        userId: options?.userId,
        formVersion: options?.formVersion || '1.0',
        autoSaved: options?.autoSave || false
      }
    };

    return this.setItem(`form_cache_${formId}`, cacheEntry, {
      ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
      priority: 'high',
      tags: ['form', 'cache', formId],
      syncToServer: true
    });
  }

  /**
   * Retrieve cached form data
   */
  async getCachedFormData(formId: string): Promise<FormCacheEntry | null> {
    return this.getItem<FormCacheEntry>(`form_cache_${formId}`);
  }

  /**
   * Get all cached forms for a user
   */
  async getCachedForms(userId?: string): Promise<FormCacheEntry[]> {
    const forms: FormCacheEntry[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.getStorageKey('form_cache_'))) {
        const form = await this.getItem<FormCacheEntry>(key.replace(this.getStorageKey(''), ''));
        if (form && (!userId || form.metadata.userId === userId)) {
          forms.push(form);
        }
      }
    }

    return forms.sort((a, b) => b.lastModified - a.lastModified);
  }

  /**
   * Store user preferences
   */
  async setUserPreference(key: string, value: any, userId?: string): Promise<boolean> {
    const prefKey = userId ? `user_pref_${userId}_${key}` : `user_pref_${key}`;
    
    return this.setItem(prefKey, value, {
      ttl: 365 * 24 * 60 * 60 * 1000, // 1 year
      priority: 'medium',
      tags: ['preference', 'user', key],
      syncToServer: true
    });
  }

  /**
   * Get user preference
   */
  async getUserPreference<T>(key: string, userId?: string, defaultValue?: T): Promise<T | null> {
    const prefKey = userId ? `user_pref_${userId}_${key}` : `user_pref_${key}`;
    const value = await this.getItem<T>(prefKey);
    
    return value !== null ? value : (defaultValue || null);
  }

  /**
   * Cache API response with smart invalidation
   */
  async cacheApiResponse(
    endpoint: string,
    params: Record<string, any>,
    response: any,
    ttl?: number
  ): Promise<boolean> {
    const cacheKey = this.generateCacheKey(endpoint, params);
    
    return this.setItem(`api_cache_${cacheKey}`, {
      endpoint,
      params,
      response,
      cachedAt: Date.now()
    }, {
      ttl: ttl || 15 * 60 * 1000, // 15 minutes default
      priority: 'low',
      tags: ['api', 'cache', endpoint],
      compress: true
    });
  }

  /**
   * Get cached API response
   */
  async getCachedApiResponse(endpoint: string, params: Record<string, any>): Promise<any | null> {
    const cacheKey = this.generateCacheKey(endpoint, params);
    const cached = await this.getItem(`api_cache_${cacheKey}`);
    
    return cached ? cached.response : null;
  }

  /**
   * Invalidate API cache by pattern
   */
  async invalidateApiCache(pattern: string): Promise<number> {
    let invalidatedCount = 0;
    
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.includes(`api_cache_`) && key.includes(pattern)) {
        localStorage.removeItem(key);
        invalidatedCount++;
      }
    }

    this.updateStats();
    this.log(`Invalidated ${invalidatedCount} API cache entries matching: ${pattern}`);
    return invalidatedCount;
  }

  /**
   * Sync pending data to server
   */
  async syncToServer(): Promise<{ success: number; failed: number }> {
    if (!this.isOnline || this.syncInProgress) {
      return { success: 0, failed: 0 };
    }

    this.syncInProgress = true;
    const startTime = performance.now();
    let successCount = 0;
    let failedCount = 0;

    try {
      const pendingOperations = [...this.syncQueue];
      
      for (const operation of pendingOperations) {
        try {
          // Simulate API call - replace with actual implementation
          await this.performSyncOperation(operation);
          
          // Remove from queue on success
          this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id);
          successCount++;
        } catch (error) {
          operation.retryCount++;
          operation.lastError = error instanceof Error ? error.message : 'Unknown error';
          operation.status = 'failed';
          failedCount++;

          // Remove from queue if max retries exceeded
          if (operation.retryCount >= 3) {
            this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id);
          }
        }
      }

      // Save updated sync queue
      this.saveSyncQueue();

      // Update performance stats
      const syncTime = performance.now() - startTime;
      this.updatePerformanceStats('sync', syncTime);

      this.log(`Sync completed: ${successCount} success, ${failedCount} failed`);
    } finally {
      this.syncInProgress = false;
    }

    return { success: successCount, failed: failedCount };
  }

  /**
   * Get storage statistics
   */
  getStats(): StorageStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Clear all storage data
   */
  async clearAll(keepUserPreferences = true): Promise<boolean> {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('els_')) {
          if (!keepUserPreferences || !key.includes('user_pref_')) {
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear sync queue
      this.syncQueue = [];
      this.saveSyncQueue();

      this.updateStats();
      this.log(`Cleared ${keysToRemove.length} items from storage`);
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  /**
   * Export storage data
   */
  async exportData(): Promise<{ data: Record<string, any>; metadata: any }> {
    const data: Record<string, any> = {};
    const metadata = {
      exportedAt: Date.now(),
      totalItems: 0,
      version: '1.0'
    };

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('els_')) {
        const value = localStorage.getItem(key);
        if (value) {
          data[key] = JSON.parse(value);
          metadata.totalItems++;
        }
      }
    }

    return { data, metadata };
  }

  /**
   * Import storage data
   */
  async importData(exportedData: { data: Record<string, any>; metadata: any }): Promise<boolean> {
    try {
      Object.entries(exportedData.data).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
      });

      this.updateStats();
      this.log(`Imported ${exportedData.metadata.totalItems} items`);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  /**
   * Private helper methods
   */
  private getStorageKey(key: string): string {
    return `els_${key}`;
  }

  private generateCacheKey(endpoint: string, params: Record<string, any>): string {
    const paramString = JSON.stringify(params, Object.keys(params).sort());
    return btoa(`${endpoint}_${paramString}`).replace(/[^a-zA-Z0-9]/g, '');
  }

  private compress(data: any): any {
    // Simplified compression - in real implementation, use actual compression library
    if (typeof data === 'string' && data.length > 1000) {
      return { __compressed: true, data: btoa(data) };
    }
    return data;
  }

  private decompress(data: any): any {
    if (data && data.__compressed) {
      return atob(data.data);
    }
    return data;
  }

  private isCompressed(data: any): boolean {
    return data && data.__compressed === true;
  }

  private hasSpaceAvailable(): boolean {
    try {
      // Estimate current usage
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('els_')) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        }
      }

      const maxSizeBytes = this.config.maxSize * 1024 * 1024;
      return totalSize < maxSizeBytes * this.cacheStrategy.cleanupThreshold;
    } catch (error) {
      return false;
    }
  }

  private async performCleanup(): Promise<number> {
    const items: Array<{ key: string; item: StorageItem; size: number }> = [];
    
    // Collect all items with metadata
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('els_')) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const item: StorageItem = JSON.parse(value);
            items.push({ key, item, size: value.length });
          } catch (error) {
            // Remove corrupted items
            localStorage.removeItem(key);
          }
        }
      }
    }

    // Remove expired items
    let removedCount = 0;
    const now = Date.now();
    
    items.forEach(({ key, item }) => {
      if (item.expiresAt && now > item.expiresAt) {
        localStorage.removeItem(key);
        removedCount++;
      }
    });

    // Apply cache strategy for remaining items
    const remainingItems = items.filter(({ item }) => 
      !item.expiresAt || now <= item.expiresAt
    );

    if (remainingItems.length > this.cacheStrategy.maxItems) {
      // Sort by strategy and remove excess
      remainingItems.sort((a, b) => {
        switch (this.cacheStrategy.type) {
          case 'lru':
            return a.item.timestamp - b.item.timestamp;
          case 'priority':
            const priorityOrder = { low: 0, medium: 1, high: 2 };
            return priorityOrder[a.item.metadata?.priority || 'medium'] - 
                   priorityOrder[b.item.metadata?.priority || 'medium'];
          default:
            return a.item.timestamp - b.item.timestamp;
        }
      });

      const itemsToRemove = remainingItems.slice(0, remainingItems.length - this.cacheStrategy.maxItems);
      itemsToRemove.forEach(({ key }) => {
        localStorage.removeItem(key);
        removedCount++;
      });
    }

    this.stats.lastCleanup = now;
    this.updateStats();
    this.log(`Cleanup completed: removed ${removedCount} items`);
    
    return removedCount;
  }

  private addToSyncQueue(type: 'create' | 'update' | 'delete', key: string, data: any): void {
    const operation: SyncOperation = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      key,
      data,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0
    };

    this.syncQueue.push(operation);
    this.saveSyncQueue();
  }

  private async performSyncOperation(operation: SyncOperation): Promise<void> {
    // Simulate API call - replace with actual implementation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          resolve();
        } else {
          reject(new Error('Sync failed'));
        }
      }, 100);
    });
  }

  private processSyncQueue(): void {
    if (this.isOnline && !this.syncInProgress && this.syncQueue.length > 0) {
      this.syncToServer();
    }
  }

  private loadSyncQueue(): void {
    try {
      const saved = localStorage.getItem('els_sync_queue');
      if (saved) {
        this.syncQueue = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
      this.syncQueue = [];
    }
  }

  private saveSyncQueue(): void {
    try {
      localStorage.setItem('els_sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  private updateStats(): void {
    let totalItems = 0;
    let totalSize = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('els_')) {
        const value = localStorage.getItem(key);
        if (value) {
          totalItems++;
          totalSize += value.length;
        }
      }
    }

    this.stats.totalItems = totalItems;
    this.stats.totalSize = totalSize;
    this.stats.syncPendingCount = this.syncQueue.length;
    
    // Estimate available space (simplified)
    const maxSizeBytes = this.config.maxSize * 1024 * 1024;
    this.stats.availableSpace = Math.max(0, maxSizeBytes - totalSize);
  }

  private updatePerformanceStats(operation: 'read' | 'write' | 'sync', time: number): void {
    const current = this.stats.performance;
    
    switch (operation) {
      case 'read':
        current.averageReadTime = (current.averageReadTime + time) / 2;
        break;
      case 'write':
        current.averageWriteTime = (current.averageWriteTime + time) / 2;
        break;
      case 'sync':
        current.averageSyncTime = (current.averageSyncTime + time) / 2;
        break;
    }
  }

  private log(message: string, data?: any): void {
    if (this.config.debugMode) {
      console.log(`[EnhancedLocalStorage] ${message}`, data || '');
    }
  }
}

// Export singleton instance
export const enhancedLocalStorageService = new EnhancedLocalStorageService();
export default enhancedLocalStorageService;
