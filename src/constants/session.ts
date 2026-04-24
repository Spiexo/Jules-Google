import type { SessionState } from '../types/jules';

export const ACTIVE_STATES: ReadonlyArray<SessionState> = [
  'QUEUED', 'PLANNING', 'AWAITING_PLAN_APPROVAL', 'AWAITING_USER_FEEDBACK', 'IN_PROGRESS',
];

export const STATE_LABEL: Readonly<Record<string, string>> = {
  QUEUED:                 'En file',
  PLANNING:               'Planification',
  AWAITING_PLAN_APPROVAL: 'Plan à approuver',
  AWAITING_USER_FEEDBACK: 'Retour requis',
  IN_PROGRESS:            'En cours',
  PAUSED:                 'En pause',
  COMPLETED:              'Terminé',
  FAILED:                 'Échec',
  STATE_UNSPECIFIED:      'Inconnu',
};
