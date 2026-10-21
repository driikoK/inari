import type { MEMBER_KIND } from '../../shared/index.js';

export class MemberData {
  nickname: string;
  types: string[];
  kind?: MEMBER_KIND;
  coins?: number;
}
