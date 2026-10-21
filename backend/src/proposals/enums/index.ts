import { MEMBER_ROLE } from '../../shared/index.js';

export const PROPOSAL_ROLES = [
  MEMBER_ROLE.SUB,
  MEMBER_ROLE.EDITOR,
  MEMBER_ROLE.TYPESETTER,
  MEMBER_ROLE.DUB,
  MEMBER_ROLE.FIXER,
  MEMBER_ROLE.SOUND,
  MEMBER_ROLE.RELEASER,
  MEMBER_ROLE.DIRECTOR,
] as const;

export type ProposalRole = (typeof PROPOSAL_ROLES)[number];

export enum PROPOSAL_FUNDING {
  PATRON = 'patron',
  ORDER = 'order',
}

export const MAX_PROPOSALS_PER_PERSON = 3;
