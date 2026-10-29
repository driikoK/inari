import { SEASON } from '../../shared/index.js';

export enum ENTRY_TYPE {
  INCOME = 'income',
  ALLOCATION = 'allocation',
  EXPENSE = 'expense',
}

export enum SUPPORT_DIRECTION {
  COVERS = 'covers',
  PROMOTION = 'promotion',
  ADS = 'ads',
  SITE = 'site',
  SERVER = 'server',
  BOTS = 'bots',
  TRAINING = 'training',
  EQUIPMENT = 'equipment',
  HOLIDAY = 'holiday',
  OTHER = 'other',
}

export enum EXPENSE_KIND {
  CARD = 'card',
  DONATION = 'donation',
  DEVELOPMENT = 'development',
}

export enum EXPENSE_SECTION {
  SUPPORT = 'support',
  ORDERS = 'orders',
  CRUMBS = 'crumbs',
}

export enum REQUEST_STATUS {
  OPEN = 'open',
  DONE = 'done',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
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
  SUPPORT = 'support',
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
  SUPPORT_UPDATED = 'support.updated',
  ALLOCATION_DELETED = 'allocation.deleted',
  EXPENSE_CREATED = 'expense.created',
  EXPENSE_UPDATED = 'expense.updated',
  EXPENSE_DELETED = 'expense.deleted',
  REQUEST_FULFILLED = 'request.fulfilled',
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

export const DIRECTION_LABEL: Record<SUPPORT_DIRECTION, string> = {
  [SUPPORT_DIRECTION.COVERS]: 'Кавери',
  [SUPPORT_DIRECTION.PROMOTION]: 'Команда просування',
  [SUPPORT_DIRECTION.ADS]: 'Реклама',
  [SUPPORT_DIRECTION.SITE]: 'Сайт',
  [SUPPORT_DIRECTION.SERVER]: 'Сервер для роздачі',
  [SUPPORT_DIRECTION.BOTS]: 'Командні боти',
  [SUPPORT_DIRECTION.TRAINING]: 'Навчання',
  [SUPPORT_DIRECTION.EQUIPMENT]: 'Техніка',
  [SUPPORT_DIRECTION.HOLIDAY]: 'Святкові ласощі',
  [SUPPORT_DIRECTION.OTHER]: 'Інше',
};

export const KIND_LABEL: Record<EXPENSE_KIND, string> = {
  [EXPENSE_KIND.CARD]: 'На карту',
  [EXPENSE_KIND.DONATION]: 'Донат',
  [EXPENSE_KIND.DEVELOPMENT]: 'На розвиток команди',
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
