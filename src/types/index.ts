export interface GoFile {
  id: string;
  name: string;
  content: string;
  isMain?: boolean;
  updatedAt?: number;
}

export interface CompileEvent {
  Message: string;
  Kind: 'stdout' | 'stderr';
  Delay: number;
}

export interface CompileResult {
  success: boolean;
  events: CompileEvent[];
  errors: string;
  vetErrors: string;
  executionTimeMs?: number;
  stdinUsed?: string;
}

export interface ParsedError {
  line?: number;
  column?: number;
  message: string;
  file?: string;
  raw: string;
}

export interface GoLesson {
  id: string;
  title: string;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé' | 'Go 1.22+' | 'Go 1.23+';
  summary: string;
  explanation: string;
  keyConcepts: string[];
  code: string;
}

export interface GoEducationalInsight {
  concept: string;
  whatWasWrong: string;
  whyGoWorksThisWay: string;
  proTip: string;
  officialRule?: string;
  beforeSnippet?: string;
  afterSnippet?: string;
}

export interface LearnedRule {
  id: string;
  timestamp: number;
  concept: string;
  whatWasWrong: string;
  whyGoWorksThisWay: string;
  proTip: string;
  fixApplied: string;
  ruleId: string;
}

