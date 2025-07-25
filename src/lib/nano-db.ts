// A simple in-memory database for fallback purposes.
// This is not a complete implementation of a database, but it
// provides the basic functionality needed for the application
// to continue working when the primary database is not available.

class NanoDB {
  private data: { [key: string]: any[] } = {};

  create(collection: string, item: any) {
    if (!this.data[collection]) {
      this.data[collection] = [];
    }
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
    this.data[collection].push(newItem);
    return Promise.resolve({ success: true, data: newItem });
  }

  getById(collection: string, id: string) {
    const items = this.data[collection] || [];
    const item = items.find((item) => item.id === id);
    return Promise.resolve({ success: !!item, data: item });
  }

  getAll(collection: string) {
    const items = this.data[collection] || [];
    return Promise.resolve({ success: true, data: items });
  }

  update(collection: string, id: string, updates: any) {
    const items = this.data[collection] || [];
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) {
      return Promise.resolve({ success: false, error: 'Item not found' });
    }
    const updatedItem = { ...items[index], ...updates };
    this.data[collection][index] = updatedItem;
    return Promise.resolve({ success: true, data: updatedItem });
  }

  delete(collection: string, id: string) {
    const items = this.data[collection] || [];
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) {
      return Promise.resolve({ success: false, error: 'Item not found' });
    }
    this.data[collection].splice(index, 1);
    return Promise.resolve({ success: true });
  }
}

export const nanoDB = new NanoDB();
