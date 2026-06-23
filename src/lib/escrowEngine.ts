import type { ActivityEvent, Dispute, Job, Milestone, UserProfile } from '../types';

const now = () => new Date().toISOString();
const future = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();
const id = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

export const users: UserProfile[] = [
  {
    id: 'usr_client',
    username: 'Maya Chen',
    walletAddress: 'GCMAYA7VQH3Y4K2ZQ4FQG2QJ5H8V2PRZ7ESCROWXCLIENT',
    avatar: 'MC',
    averageRating: 4.8,
    completedJobs: 31,
    disputesLost: 1
  },
  {
    id: 'usr_freelancer',
    username: 'Arjun Rao',
    walletAddress: 'GBARJUNY9WD2T7TR5Z5K6E4K3A2SOROBANFREELANCE',
    avatar: 'AR',
    averageRating: 4.9,
    completedJobs: 44,
    disputesLost: 0
  },
  {
    id: 'usr_arbiter',
    username: 'Nora Vale',
    walletAddress: 'GDARBITER8JURY2RESOLUTION5STELLARVOTE',
    avatar: 'NV',
    averageRating: 4.7,
    completedJobs: 18,
    disputesLost: 0
  }
];

export const initialMilestones: Milestone[] = [
  {
    id: 'ms_wireframes',
    title: 'UX audit and wireframes',
    amountXlm: 20,
    dueInDays: 3,
    status: 'released',
    autoReleaseAt: future(1),
    evidenceHash: 'bafybeih5wireframesauditproof'
  },
  {
    id: 'ms_build',
    title: 'Responsive frontend build',
    amountXlm: 30,
    dueInDays: 7,
    status: 'submitted',
    autoReleaseAt: future(7),
    evidenceHash: 'bafybeifrontendbuildzipproof'
  },
  {
    id: 'ms_launch',
    title: 'Production launch and handoff',
    amountXlm: 50,
    dueInDays: 10,
    status: 'pending',
    autoReleaseAt: future(10)
  }
];

export const initialJobs: Job[] = [
  {
    id: 'job_brand_portal',
    title: 'Creator commerce dashboard',
    client: users[0],
    freelancer: users[1],
    status: 'funded',
    totalAmountXlm: 100,
    fundedAmountXlm: 100,
    category: 'Product design',
    createdAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    milestones: initialMilestones
  },
  {
    id: 'job_contract_audit',
    title: 'Soroban contract audit',
    client: users[1],
    freelancer: users[2],
    status: 'disputed',
    totalAmountXlm: 75,
    fundedAmountXlm: 75,
    category: 'Security',
    createdAt: new Date(Date.now() - 6 * 86_400_000).toISOString(),
    milestones: [
      {
        id: 'ms_audit',
        title: 'Risk report and patch list',
        amountXlm: 75,
        dueInDays: 5,
        status: 'disputed',
        autoReleaseAt: future(2),
        evidenceHash: 'bafybeiauditpacketpdf'
      }
    ]
  }
];

export const initialDisputes: Dispute[] = [
  {
    id: 'disp_audit',
    jobId: 'job_contract_audit',
    milestoneId: 'ms_audit',
    openedBy: 'client',
    evidenceHash: 'bafybeiauditpacketpdf',
    status: 'voting',
    votesForClient: 2,
    votesForFreelancer: 3
  }
];

export const initialActivity: ActivityEvent[] = [
  {
    id: 'evt_1',
    type: 'payment_released',
    title: '20 XLM released',
    detail: 'Milestone "UX audit and wireframes" paid to Arjun Rao.',
    createdAt: now()
  },
  {
    id: 'evt_2',
    type: 'dispute_opened',
    title: 'Dispute opened',
    detail: 'Evidence hash bafybeiauditpacketpdf attached to Soroban dispute.',
    createdAt: new Date(Date.now() - 30 * 60_000).toISOString()
  },
  {
    id: 'evt_3',
    type: 'funds_deposited',
    title: '100 XLM locked',
    detail: 'Client funded all milestones for Creator commerce dashboard.',
    createdAt: new Date(Date.now() - 90 * 60_000).toISOString()
  }
];

export function reputationScore(user: UserProfile): number {
  return Number((user.averageRating * 20 + user.completedJobs * 0.65 - user.disputesLost * 8).toFixed(1));
}

export function analytics(jobs: Job[], disputes: Dispute[]) {
  const volume = jobs.reduce((sum, job) => sum + job.fundedAmountXlm, 0);
  const released = jobs.flatMap((job) => job.milestones).filter((milestone) => milestone.status === 'released');
  const allMilestones = jobs.flatMap((job) => job.milestones);
  return {
    totalVolume: volume,
    activeEscrows: jobs.filter((job) => ['funded', 'in_progress', 'disputed'].includes(job.status)).length,
    successRate: Math.round((released.length / allMilestones.length) * 100),
    disputesResolved: disputes.filter((dispute) => dispute.status === 'resolved').length,
    lockedValue: jobs.reduce((sum, job) => {
      const locked = job.milestones
        .filter((milestone) => ['pending', 'submitted', 'disputed'].includes(milestone.status))
        .reduce((subtotal, milestone) => subtotal + milestone.amountXlm, 0);
      return sum + locked;
    }, 0)
  };
}

export function createJobFromForm(title: string, client: UserProfile, freelancer: UserProfile, milestones: Milestone[]): Job {
  const totalAmountXlm = milestones.reduce((sum, milestone) => sum + milestone.amountXlm, 0);
  return {
    id: id('job'),
    title,
    client,
    freelancer,
    status: 'draft',
    totalAmountXlm,
    fundedAmountXlm: 0,
    category: 'Custom build',
    createdAt: now(),
    milestones
  };
}

export function releaseMilestone(job: Job, milestoneId: string): Job {
  const milestones = job.milestones.map((milestone) =>
    milestone.id === milestoneId ? { ...milestone, status: 'released' as const } : milestone
  );
  const completed = milestones.every((milestone) => milestone.status === 'released');
  return { ...job, milestones, status: completed ? 'completed' : 'in_progress' };
}

export function eventFor(type: ActivityEvent['type'], title: string, detail: string): ActivityEvent {
  return { id: id('evt'), type, title, detail, createdAt: now() };
}

export function nextMilestone(title: string, amountXlm: number, dueInDays: number): Milestone {
  return {
    id: id('ms'),
    title,
    amountXlm,
    dueInDays,
    status: 'pending',
    autoReleaseAt: future(dueInDays)
  };
}
