// Shared shapes for the pipeline data.

export type UniverseItem = {
  n: string; s: string; p: string; c: string; sc: string;
  w: string; fin: string; rr: string; cm: string;
};

export type Candidate = {
  n: string; p: string; sc: string; fo: string; fund: string; ind: string;
  rev: string; pat: string; on: string; v: string; conf: string;
  src: string; ent: string; note: string;
};

export type Prospect = Candidate & { st: string; ad: string };
