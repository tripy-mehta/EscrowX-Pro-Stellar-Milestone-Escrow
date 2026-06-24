import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileUp,
  Gavel,
  LayoutDashboard,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet
} from 'lucide-react';
import clsx from 'clsx';
import { analytics, eventFor, initialActivity, initialDisputes, initialJobs, nextMilestone, releaseMilestone, reputationScore, users } from './lib/escrowEngine';
import { contractIds, eventStream } from './lib/contractClient';
import type { ActivityEvent, Dispute, Job, Milestone } from './types';
import { requestAccess, getAddress, signTransaction } from '@stellar/freighter-api';
import { Horizon, TransactionBuilder, Networks, Operation, Asset } from '@stellar/stellar-sdk';
import toast, { Toaster } from 'react-hot-toast';
const tabs = ['Dashboard', 'Create Job', 'Jobs', 'Disputes', 'Reputation'] as const;
type Tab = (typeof tabs)[number];

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [disputes, setDisputes] = useState<Dispute[]>(initialDisputes);
  const [activity, setActivity] = useState<ActivityEvent[]>(initialActivity);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const metrics = useMemo(() => analytics(jobs, disputes), [jobs, disputes]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const selectedJob = jobs.find(j => j.id === selectedJobId) || jobs[0];

  useEffect(() => {
    eventStream.connect();
    return eventStream.subscribe((event) => setActivity((items) => [event, ...items].slice(0, 8)));
  }, []);

  const fetchBalance = async (address: string) => {
    try {
      const server = new Horizon.Server("https://horizon-testnet.stellar.org");
      const account = await server.loadAccount(address);
      const xlmBalance = account.balances.find(b => b.asset_type === 'native');
      if (xlmBalance) setBalance(xlmBalance.balance);
    } catch (e) {
      console.error(e);
    }
  };

  const connectWallet = async () => {
    try {
      if (await requestAccess()) {
        const { address, error } = await getAddress();
        if (error || !address) throw new Error(error);
        setWalletAddress(address);
        setWalletConnected(true);
        toast.success(`Wallet connected: ${address.slice(0, 4)}...${address.slice(-4)}`);
        await fetchBalance(address);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to connect wallet');
    }
  };

  const publish = (event: ActivityEvent) => {
    eventStream.emit(event);
  };

  const verifyToast = (title: string, txHash?: string) => {
    if (txHash) {
      toast(() => (
        <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <b>{title}</b>
          <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noreferrer" style={{color: '#4ade80', fontSize: '12px', textDecoration: 'underline'}}>Verify on Stellar</a>
        </span>
      ), { duration: 5000, style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #4ade80' } });
    } else {
      toast.success(title, { duration: 3000, style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #4ade80' } });
    }
  };

  const performWalletAction = async (actionFn: (hash: string) => void, amount: string = "0.0000001") => {
    if (!walletAddress) {
      toast.error('Connect wallet first');
      return;
    }
    const tId = toast.loading('Waiting for wallet signature...', { style: { background: '#1e293b', color: '#f8fafc' } });
    
    try {
      const server = new Horizon.Server("https://horizon-testnet.stellar.org");
      const account = await server.loadAccount(walletAddress);
      
      const tx = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: Networks.TESTNET
      })
      .addOperation(Operation.payment({
        destination: "GBFHL65A442MESIWKHFEGMWN6GIIECAMTTEX5QYB6SFI5O3W55GAZWES", // Vault address
        asset: Asset.native(),
        amount: amount
      }))
      .setTimeout(30)
      .build();

      const signResult = await signTransaction(tx.toXDR(), { networkPassphrase: Networks.TESTNET });
      if (signResult.error) throw new Error(signResult.error);

      toast.loading('Submitting to Stellar...', { id: tId });
      
      const txToSubmit = TransactionBuilder.fromXDR(signResult.signedTxXdr, Networks.TESTNET);
      const response = await server.submitTransaction(txToSubmit);

      toast.dismiss(tId);
      
      if (response.successful) {
        actionFn(response.hash);
        await fetchBalance(walletAddress);
      } else {
        toast.error('Transaction failed');
      }

    } catch (e) {
      console.error(e);
      toast.error('Transaction rejected or failed', { id: tId });
    }
  };

  const fundJob = async () => {
    await performWalletAction((hash) => {
      setJobs((items) =>
        items.map((job) => (job.id === selectedJob.id ? { ...job, status: 'funded', fundedAmountXlm: job.totalAmountXlm } : job))
      );
      verifyToast('100 XLM deposited', hash);
      publish(eventFor('funds_deposited', '100 XLM deposited', 'Soroban escrow contract locked funds for all milestones.'));
    }, "100");
  };

  const approveMilestone = async (milestone: Milestone) => {
    await performWalletAction((hash) => {
      setJobs((items) => items.map((job) => (job.id === selectedJob.id ? releaseMilestone(job, milestone.id) : job)));
      verifyToast(`${milestone.amountXlm} XLM released`, hash);
      publish(eventFor('payment_released', `${milestone.amountXlm} XLM released`, `${milestone.title} approved and paid automatically.`));
    }, milestone.amountXlm.toString());
  };

  const openDispute = async (milestone: Milestone) => {
    const dispute: Dispute = {
      id: `disp_${milestone.id}`,
      jobId: selectedJob.id,
      milestoneId: milestone.id,
      openedBy: 'client',
      evidenceHash: milestone.evidenceHash ?? 'bafybeinewevidenceupload',
      status: 'open',
      votesForClient: 0,
      votesForFreelancer: 0
    };
    await performWalletAction((hash) => {
      setDisputes((items) => [dispute, ...items]);
      setJobs((items) =>
        items.map((job) =>
          job.id === selectedJob.id
            ? {
                ...job,
                status: 'disputed',
                milestones: job.milestones.map((item) => (item.id === milestone.id ? { ...item, status: 'disputed' } : item))
              }
            : job
        )
      );
      verifyToast('Dispute opened', hash);
      publish(eventFor('dispute_opened', 'Dispute opened', `Evidence stored at IPFS hash ${dispute.evidenceHash}.`));
    });
  };

  const resolveDispute = async (disputeId: string) => {
    await performWalletAction((hash) => {
      setDisputes((items) => items.map((d) => (d.id === disputeId ? { ...d, status: 'resolved' } : d)));
      setJobs((items) =>
        items.map((job) => {
          const hasDispute = disputes.find(d => d.id === disputeId && d.jobId === job.id);
          if (hasDispute) {
            return {
              ...job,
              status: 'funded',
              milestones: job.milestones.map((m) => (m.id === hasDispute.milestoneId ? { ...m, status: 'released' } : m))
            };
          }
          return job;
        })
      );
      verifyToast('Dispute resolved', hash);
      publish(eventFor('dispute_resolved', 'Dispute resolved', 'Community consensus reached and funds distributed.'));
    });
  };

  const submitRating = async () => {
    await performWalletAction((hash) => {
      verifyToast('Reputation score updated', hash);
      publish(eventFor('rating_added', 'Rating submitted', 'Both parties signed reputation updates on-chain.'));
      publish(eventFor('score_updated', 'Reputation score updated', 'Public scores refreshed after completed milestone.'));
    });
  };

  const createDemoJob = async (job: Job) => {
    await performWalletAction((hash) => {
      setJobs((items) => [job, ...items]);
      setSelectedJobId(job.id);
      setActiveTab('Jobs');
      verifyToast('Job created successfully', hash);
      publish(eventFor('job_created', 'Job created', `${job.title} opened with ${job.milestones.length} milestones.`));
    }, job.totalAmountXlm.toString());
  };

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">X</span>
          <div>
            <strong>EscrowX Pro+</strong>
            <small>Stellar milestone escrow</small>
          </div>
        </div>
        <nav aria-label="Primary navigation">
          {tabs.map((tab) => (
            <button key={tab} className={clsx('nav-button', activeTab === tab && 'active')} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </nav>
        <button className="wallet-button" onClick={walletConnected ? () => {} : connectWallet}>
          <Wallet size={18} />
          {walletConnected ? (
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2}}>
              <span>{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</span>
              {balance && <span style={{fontSize: '11px', color: '#4ade80'}}>{parseFloat(balance).toFixed(2)} XLM</span>}
            </div>
          ) : 'Connect wallet'}
        </button>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={16} /> Soroban powered freelance trust</span>
          <h1>Secure milestone-based freelance payments with decentralized dispute resolution.</h1>
          <p>
            Funds stay locked on Stellar until milestones are approved, auto-released, or resolved by transparent
            evidence-backed voting.
          </p>
          <div className="hero-actions">
            <button className="primary" onClick={() => setActiveTab('Create Job')}>
              <Plus size={18} /> Create escrow
            </button>
            <button className="secondary" onClick={fundJob}>
              <CircleDollarSign size={18} /> Deposit 100 XLM
            </button>
          </div>
        </div>
        <div className="contract-panel" aria-label="Contract architecture">
          <div className="contract-node wide">React + TypeScript</div>
          <div className="connector" />
          <div className="contract-node wide">Express API + Socket.IO Event Listener</div>
          <div className="connector" />
          <div className="contract-grid">
            <div className="contract-node"><ShieldCheck size={20} /> Escrow</div>
            <div className="contract-node"><Star size={20} /> Reputation</div>
            <div className="contract-node"><Gavel size={20} /> Dispute</div>
          </div>
        </div>
      </section>

      <section className="workspace">
        {activeTab === 'Dashboard' && <Dashboard metrics={metrics} activity={activity} jobs={jobs} />}
        {activeTab === 'Create Job' && <CreateJob onCreate={createDemoJob} />}
        {activeTab === 'Jobs' && !selectedJobId && (
          <section className="panel">
            <div className="section-title"><ShieldCheck size={20} /> All Jobs</div>
            <div className="job-grid">
              {jobs.map(job => (
                <article className="job-card" key={job.id} onClick={() => setSelectedJobId(job.id)}>
                  <strong>{job.title}</strong>
                  <small>{job.client.username} &rarr; {job.freelancer.username}</small>
                  <p className="job-card-amount">{job.fundedAmountXlm} / {job.totalAmountXlm} XLM</p>
                  <span className={clsx('status', job.status)}>{job.status.replace('_', ' ')}</span>
                </article>
              ))}
            </div>
          </section>
        )}
        {activeTab === 'Jobs' && selectedJobId && selectedJob && (
          <JobDetails job={selectedJob} onBack={() => setSelectedJobId(null)} onApprove={approveMilestone} onDispute={openDispute} onRating={submitRating} />
        )}
        {activeTab === 'Disputes' && <DisputeCenter disputes={disputes} onResolve={resolveDispute} />}
        {activeTab === 'Reputation' && <ReputationBoard />}
      </section>

      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            marginTop: '60px',
            fontSize: '15px',
            padding: '16px 24px',
            maxWidth: '400px'
          }
        }}
      />
    </main>
  );
}

function Dashboard({ metrics, activity, jobs }: { metrics: ReturnType<typeof analytics>; activity: ActivityEvent[]; jobs: Job[] }) {
  const cards = [
    ['Total Volume', `${metrics.totalVolume} XLM`, CircleDollarSign],
    ['Active Escrows', metrics.activeEscrows.toString(), ShieldCheck],
    ['Success Rate', `${metrics.successRate}%`, BadgeCheck],
    ['Locked Value', `${metrics.lockedValue} XLM`, Clock3]
  ] as const;

  return (
    <div className="dashboard-grid">
      <section className="panel metrics-panel">
        <div className="section-title"><LayoutDashboard size={20} /> Analytics dashboard</div>
        <div className="metric-grid">
          {cards.map(([label, value, Icon]) => (
            <div className="metric" key={label}>
              <Icon size={22} />
              <small>{label}</small>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="panel chart-panel">
        <div className="section-title"><BarChart3 size={20} /> Escrow health</div>
        <div className="bars">
          {jobs.map((job) => (
            <div className="bar-row" key={job.id}>
              <span>{job.title}</span>
              <div><i style={{ width: `${(job.fundedAmountXlm / job.totalAmountXlm) * 100}%` }} /></div>
              <strong>{job.fundedAmountXlm}/{job.totalAmountXlm} XLM</strong>
            </div>
          ))}
        </div>
      </section>
      <ActivityFeed activity={activity} />
    </div>
  );
}

function ActivityFeed({ activity }: { activity: ActivityEvent[] }) {
  return (
    <section className="panel activity-panel">
      <div className="section-title"><Activity size={20} /> Live activity feed</div>
      <div className="timeline">
        {activity.map((event) => (
          <article key={event.id}>
            <span />
            <div>
              <strong>{event.title}</strong>
              <p>{event.detail}</p>
              <small>{new Date(event.createdAt).toLocaleTimeString()}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CreateJob({ onCreate }: { onCreate: (job: Job) => void }) {
  const [title, setTitle] = useState('Landing page redesign');
  const [milestones, setMilestones] = useState<Milestone[]>([
    nextMilestone('Discovery and prototype', 25, 3),
    nextMilestone('Implementation', 45, 7),
    nextMilestone('QA and launch', 30, 10)
  ]);
  const total = milestones.reduce((sum, milestone) => sum + milestone.amountXlm, 0);

  return (
    <section className="panel form-panel">
      <div className="section-title"><Plus size={20} /> Create milestone escrow</div>
      <label>
        Job title
        <input value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <div className="milestone-editor">
        {milestones.map((milestone, index) => (
          <div className="milestone-input" key={milestone.id}>
            <input value={milestone.title} onChange={(event) => setMilestones((items) => items.map((item, i) => (i === index ? { ...item, title: event.target.value } : item)))} />
            <input type="number" value={milestone.amountXlm} onChange={(event) => setMilestones((items) => items.map((item, i) => (i === index ? { ...item, amountXlm: Number(event.target.value) } : item)))} />
            <input type="number" value={milestone.dueInDays} onChange={(event) => setMilestones((items) => items.map((item, i) => (i === index ? { ...item, dueInDays: Number(event.target.value) } : item)))} />
          </div>
        ))}
      </div>
      <div className="form-actions">
        <button className="secondary" onClick={() => setMilestones((items) => [...items, nextMilestone('New milestone', 10, 5)])}>
          <Plus size={18} /> Add milestone
        </button>
        <button className="primary" onClick={() => onCreate({
          id: `job_${Date.now()}`,
          title,
          client: users[0],
          freelancer: users[1],
          status: 'draft',
          totalAmountXlm: total,
          fundedAmountXlm: 0,
          category: 'Custom build',
          createdAt: new Date().toISOString(),
          milestones
        })}>
          <ShieldCheck size={18} /> Create {total} XLM escrow
        </button>
      </div>
    </section>
  );
}

function JobDetails({ job, onBack, onApprove, onDispute, onRating }: { job: Job; onBack: () => void; onApprove: (milestone: Milestone) => void; onDispute: (milestone: Milestone) => void; onRating: () => void }) {
  return (
    <section className="panel job-panel">
      <div className="section-title">
        <button onClick={onBack} style={{background: 'transparent', border: 'none', color: '#cbd5e1', padding: '0 8px', marginRight: '8px', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1}}>
          &larr;
        </button>
        <ShieldCheck size={20} /> {job.title}
      </div>
      <div className="job-meta">
        <Pill label="Client" value={job.client.username} />
        <Pill label="Freelancer" value={job.freelancer.username} />
        <Pill label="Status" value={job.status.replace('_', ' ')} />
        <Pill label="Contracts" value={`${contractIds.escrow.slice(0, 8)}...`} />
      </div>
      <div className="milestones">
        {job.milestones.map((milestone) => (
          <article className="milestone-card" key={milestone.id}>
            <div>
              <strong>{milestone.title}</strong>
              <p>{milestone.amountXlm} XLM | auto-release {new Date(milestone.autoReleaseAt).toLocaleDateString()}</p>
            </div>
            <span className={clsx('status', milestone.status)}>{milestone.status}</span>
            <div className="row-actions">
              <button onClick={() => onApprove(milestone)}><CheckCircle2 size={17} /> Approve</button>
              <button onClick={() => onDispute(milestone)}><AlertTriangle size={17} /> Dispute</button>
              <button><FileUp size={17} /> Evidence</button>
            </div>
          </article>
        ))}
      </div>
      <button className="primary" onClick={onRating}><Star size={18} /> Submit mutual ratings</button>
    </section>
  );
}

function DisputeCenter({ disputes, onResolve }: { disputes: Dispute[]; onResolve: (id: string) => void }) {
  return (
    <section className="panel">
      <div className="section-title"><Gavel size={20} /> Dispute center</div>
      <div className="dispute-grid">
        {disputes.map((dispute) => (
          <article className="dispute-card" key={dispute.id}>
            <strong>{dispute.id}</strong>
            <p>Evidence: {dispute.evidenceHash}</p>
            <div className="vote-meter">
              <span style={{ flex: dispute.votesForClient + 1 }}>Client {dispute.votesForClient}</span>
              <span style={{ flex: dispute.votesForFreelancer + 1 }}>Freelancer {dispute.votesForFreelancer}</span>
            </div>
            {dispute.status === 'resolved' ? (
              <div className="status released" style={{marginTop: '12px'}}>Resolved</div>
            ) : (
              <button className="primary" onClick={() => onResolve(dispute.id)}>Resolve dispute</button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function ReputationBoard() {
  return (
    <section className="panel">
      <div className="section-title"><Star size={20} /> Reputation profiles</div>
      <div className="reputation-grid">
        {users.map((user) => (
          <article className="profile-card" key={user.id}>
            <span className="avatar">{user.avatar}</span>
            <strong>{user.username}</strong>
            <small>{user.walletAddress.slice(0, 12)}...</small>
            <div className="score">{reputationScore(user)}</div>
            <p>{user.averageRating} avg rating | {user.completedJobs} jobs | {user.disputesLost} disputes lost</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="pill">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
