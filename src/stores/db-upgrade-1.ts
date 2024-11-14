import DbConst from './db-constants';

function createPulseStore(db: IDBDatabase) {
  const store = db.createObjectStore(DbConst.PULSE_STORENAME, {
    keyPath: 'id',
    autoIncrement: true,
  });
  store.createIndex(DbConst.ORIGIN_TIME_IDX, ['origin', 'startTime'], {
    unique: true,
  });
  store.createIndex(DbConst.ORIGIN_IDX, 'origin', { unique: false });
  store.createIndex(DbConst.TIME_IDX, 'startTime', { unique: false });
}
