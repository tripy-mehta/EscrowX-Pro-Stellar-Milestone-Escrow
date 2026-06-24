export type JobStatus = 'draft' | 'funded' | 'in_progress' | 'disputed' | 'completed' | 'cancelled';
export type MilestoneStatus = 'pending' | 'submitted' | 'approved' | 'released' | 'disputed';
export type DisputeStatus = 'open' | 'voting' | 'resolved';
export type ActorRole = 'client' | 'freelancer' | 'arbiter';

export interface UserProfile {
  id: string;
  username: string;
  walletAddress: string;
  avatar: string;
  averageRating: number;
  completedJobs: number;
  disputesLost: number;
}

export interface Milestone {
  id: string;
  title: string;
  amountXlm: number;
  dueInDays: number;
  status: MilestoneStatus;
  autoReleaseAt: string;
  evidenceHash?: string;
}

export interface Job {
  id: string;
  title: string;
  client: UserProfile;
  freelancer: UserProfile;
  status: JobStatus;
  totalAmountXlm: number;
  fundedAmountXlm: number;
  category: string;
  createdAt: string;
  milestones: Milestone[];
}

export interface Dispute {
  id: string;
  jobId: string;
  milestoneId: string;
  openedBy: ActorRole;
  evidenceHash: string;
  status: DisputeStatus;
  votesForClient: number;
  votesForFreelancer: number;
}

export interface ActivityEvent {
  id: string;
  type:
    | 'job_created'
    | 'funds_deposited'
    | 'milestone_completed'
    | 'payment_released'
    | 'dispute_opened'
    | 'dispute_resolved'
    | 'rating_added'
    | 'score_updated';
  title: string;
  detail: string;
  createdAt: string;
}
