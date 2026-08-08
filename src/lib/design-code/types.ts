export type DesignCodeRevision = {
  id: string;
  name: string;
  code: string;
  checksum: string;
  createdAt: string;
  activatedAt: string | null;
};
export type DesignCodeStore = {
  draftName: string;
  draftCode: string;
  activeRevision: DesignCodeRevision;
  lastValidRevision: DesignCodeRevision;
  history: DesignCodeRevision[];
  updatedAt: string;
};
export type DesignCodeValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  checksum: string | null;
};
