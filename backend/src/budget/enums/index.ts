import { SEASON } from '../../shared/index.js';

export enum ENTRY_TYPE {
  INCOME = 'income',
}

export enum INCOME_SOURCE {
  BMAC = 'bmac',
  DONATELLO = 'donatello',
  TEAM_JAR = 'teamJar',
  PROJECT_JAR = 'projectJar',
  ORDER = 'order',
  LISODAR = 'lisodar',
}

export enum SIDE_KIND {
  JAR = 'jar',
  ORDERS = 'orders',
  TREATS = 'treats',
  LISODARI = 'lisodari',
  CRUMBS = 'crumbs',
}

export enum AUDIT_UNIT {
  MONEY = 'money',
  CRUMBS = 'crumbs',
}

export enum AUDIT_KIND {
  INCOME_CREATED = 'income.created',
  INCOME_UPDATED = 'income.updated',
  INCOME_DELETED = 'income.deleted',
  TRACK_CREATED = 'track.created',
  TRACK_UPDATED = 'track.updated',
  TRACK_DELETED = 'track.deleted',
  MEMBER_CREATED = 'member.created',
  MEMBER_ADJUSTED = 'member.adjusted',
  CRUMBS_INITIAL = 'crumbs.initial',
}

export const SYSTEM_ACTOR = 'система';

export enum BUDGET_ERROR {
  AUDIT_NOT_SAVED = 'AUDIT_NOT_SAVED',
}

export const SOURCE_LABEL: Record<INCOME_SOURCE, string> = {
  [INCOME_SOURCE.BMAC]: 'Buy me a coffee',
  [INCOME_SOURCE.DONATELLO]: 'Donatello',
  [INCOME_SOURCE.TEAM_JAR]: 'Банка команди',
  [INCOME_SOURCE.PROJECT_JAR]: 'Банка проєкту',
  [INCOME_SOURCE.ORDER]: 'Замовлення',
  [INCOME_SOURCE.LISODAR]: 'Лисодар',
};

export const SEASON_LABEL: Record<SEASON, string> = {
  [SEASON.WINTER]: 'Зима',
  [SEASON.SPRING]: 'Весна',
  [SEASON.SUMMER]: 'Літо',
  [SEASON.FALL]: 'Осінь',
};

export const ORDER_GENERAL_PERCENT = 10;

export const MAX_AMOUNT_KOP = 1_000_000_000;

export const MIN_BUDGET_DAY = '2000-01-01';
