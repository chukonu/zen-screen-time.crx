import DbConst from './db-constants';
import DbUpgrader from './db-upgrader';

export default function upgradeDb(db: IDBDatabase): void {
  try {
    new DbUpgrader(db)
      .createObjectStore(DbConst.PULSE_STORENAME, {
        keyPath: 'id',
        autoIncrement: true,
      })
      .withIndex(DbConst.ORIGIN_TIME_IDX, ['origin', 'startTime'], {
        unique: true,
      })
      .withIndex(DbConst.ORIGIN_IDX, 'origin')
      .withIndex(DbConst.TIME_IDX, 'startTime')
      .execute();
  } catch (error) {
    console.error('while upgrading db (pulse store)', error);
    return;
  }

  try {
    new DbUpgrader(db)
      .createObjectStore(DbConst.LIMIT_STORENAME, {
        keyPath: 'id',
        autoIncrement: true,
      })
      .withIndex(DbConst.LIMIT_IDX, 'limit')
      .withIndex(DbConst.CREATETIME_IDX, 'created')
      .withIndex(DbConst.UPDATETIME_IDX, 'updated')
      .execute();
  } catch (error) {
    console.error('while upgrading db (limit store)', error);
    return;
  }

  console.debug('DB upgrade finished');
}
