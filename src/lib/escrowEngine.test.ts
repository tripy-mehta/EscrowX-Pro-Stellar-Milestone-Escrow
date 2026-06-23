import { describe, expect, it } from 'vitest';
import { analytics, initialDisputes, initialJobs, releaseMilestone, reputationScore, users } from './escrowEngine';

describe('escrow engine', () => {
  it('calculates production dashboard metrics', () => {
    const result = analytics(initialJobs, initialDisputes);
    expect(result.totalVolume).toBe(175);
    expect(result.activeEscrows).toBe(2);
    expect(result.lockedValue).toBeGreaterThan(0);
  });

  it('releases a milestone and keeps job active until all are paid', () => {
    const job = releaseMilestone(initialJobs[0], 'ms_build');
    expect(job.milestones.find((milestone) => milestone.id === 'ms_build')?.status).toBe('released');
    expect(job.status).toBe('in_progress');
  });

  it('weights reputation by rating, completed jobs, and disputes', () => {
    expect(reputationScore(users[1])).toBeGreaterThan(reputationScore(users[0]));
  });
});
