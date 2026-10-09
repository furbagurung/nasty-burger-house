export type DripMember = {
  id: string;
  squareCustomerId: string;
  name: string;
  email: string;
  phone: string;
  balance: number | null;
  lifetimePoints: number | null;
  enrolledAt: string | null;
};

export type DripRewardTier = {
  id: string;
  name: string | null;
  points: number;
};

export type DripProgram = {
  status: string | null;
  pointsLabel: string;
  tiers: DripRewardTier[];
};

export type DripOverviewData = {
  members: DripMember[];
  membersAvailable: boolean;
  program: DripProgram | null;
};
