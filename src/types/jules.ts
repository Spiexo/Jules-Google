export interface GithubRepo {
  owner: string;
  repo: string;
  isPrivate?: boolean;
  defaultBranch?: { displayName: string };
  branches?: { displayName: string }[];
}

export interface JulesSource {
  name: string;
  id: string;
  githubRepo?: GithubRepo;
}

export interface JulesSourcesResponse {
  sources: JulesSource[];
}

export type SessionState =
  | 'STATE_UNSPECIFIED'
  | 'QUEUED'
  | 'PLANNING'
  | 'AWAITING_PLAN_APPROVAL'
  | 'AWAITING_USER_FEEDBACK'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'FAILED'
  | 'COMPLETED';

export type AutomationMode =
  | 'AUTOMATION_MODE_UNSPECIFIED'
  | 'AUTO_CREATE_PR';

export interface PlanStep {
  id: string;
  index: number;
  title: string;
  description: string;
}

export interface Plan {
  id: string;
  steps: PlanStep[];
  createTime: string;
}

export interface Artifact {
  changeSet?: { source: string; gitPatch: unknown };
  bashOutput?: { command: string; output: string; exitCode: number };
  media?: { mimeType: string; data: string };
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';
export type ActivityOriginator = 'user' | 'agent' | 'system';

export interface Activity {
  name: string;
  id: string;
  originator: ActivityOriginator;
  description: string;
  createTime: string;
  artifacts?: Artifact[];
  planGenerated?:    { plan: Plan };
  planApproved?:     { planId: string };
  userMessaged?:     { userMessage: string };
  agentMessaged?:    { agentMessage: string };
  progressUpdated?:  { title: string; description: string };
  sessionCompleted?: Record<string, never>;
  sessionFailed?:    { reason: string };
}

export interface SessionOutput {
  pullRequest?: {
    url: string;
    title: string;
    description: string;
  };
}

export interface JulesSession {
  name: string;
  id?: string;
  title?: string;
  state?: SessionState;
  createTime?: string;
  updateTime?: string;
  prompt?: string;
  url?: string;
  automationMode?: AutomationMode;
  requirePlanApproval?: boolean;
  outputs?: SessionOutput[];
  sourceContext?: {
    source: string;
    githubRepoContext?: { startingBranch: string };
  };
}

export interface LocalSession extends JulesSession {
  state: SessionState;
  createTime: string;
  localDescription: string;
  sourceDisplayName: string;
}

export interface JulesSessionsResponse {
  sessions: JulesSession[];
  nextPageToken?: string;
}

export interface ListActivitiesResponse {
  activities: Activity[];
  nextPageToken?: string;
}

export interface LogEntry {
  time:    string;
  level:   LogLevel;
  source:  string;
  state:   string;
  message: string;
}

export interface CreateSessionRequest {
  sourceName: string;
  description: string;
  startingBranch?: string;
  automationMode?: AutomationMode;
  requirePlanApproval?: boolean;
  title?: string;
}
