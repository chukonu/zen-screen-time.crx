const DB_VER = 2393;
const DB_NAME = 'zen';
const PULSE_STORENAME = 'pulses';
const LIMIT_STORENAME = 'limits';
const ORIGIN_TIME_IDX = 'origin_time';
const ORIGIN_IDX = 'origin';
const TIME_IDX = 'start_time';
const LIMIT_IDX = 'limit';
const CREATETIME_IDX = 'createtime';
const UPDATETIME_IDX = 'updatetime';

export const DbConst = {
  DB_VER,
  DB_NAME,
  PULSE_STORENAME,
  LIMIT_STORENAME,

  // indices in the pulse store
  ORIGIN_TIME_IDX,
  ORIGIN_IDX,
  TIME_IDX,

  // indices in the limit store
  CREATETIME_IDX,
  LIMIT_IDX,
  UPDATETIME_IDX,
};

export default DbConst;
