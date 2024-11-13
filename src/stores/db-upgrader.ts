type _IDBIndexConfig = [
  name: string,
  keyPath: string | Iterable<string>,
  options?: IDBIndexParameters,
];

/**
 * DbUpgrader is a utility for creating object stores and indices in upgrade
 * handlers.
 */
export default class DbUpgrader {
  #db: IDBDatabase;
  #name: string;
  #storeOptions: IDBObjectStoreParameters;
  #indices: _IDBIndexConfig[] = [];

  constructor(db: IDBDatabase) {
    this.#db = db;
  }

  createObjectStore(name: string, options?: IDBObjectStoreParameters): this {
    this.#name = name;
    this.#storeOptions = options;
    return this;
  }

  withIndex(
    name: string,
    keyPath: string | Iterable<string>,
    options?: IDBIndexParameters,
  ): this {
    this.#indices.push([name, keyPath, options]);
    return this;
  }

  #createIndex(
    store: IDBObjectStore,
    name: string,
    keyPath: string | Iterable<string>,
    options?: IDBIndexParameters,
  ): void {
    try {
      store.createIndex(name, keyPath, options);
      console.debug(`Index "${name}" is created in "${store.name}"`);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'ConstraintError') {
        console.debug(`Index "${name}" already exists in "${store.name}"`);
      } else {
        throw error;
      }
    }
  }

  execute(): void {
    let store: IDBObjectStore;

    try {
      store = this.#db.createObjectStore(this.#name, this.#storeOptions);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'ConstraintError') {
        console.debug(`Object store "${this.#name}" already exists.`);
      } else {
        throw error;
      }
    }

    if (!store) {
      return;
    }

    this.#indices.forEach((i) => {
      this.#createIndex.apply(this, i);
    });
  }
}
