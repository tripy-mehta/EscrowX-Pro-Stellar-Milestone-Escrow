import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
vi.mock('@stellar/freighter-api', () => ({
  requestAccess: vi.fn().mockResolvedValue(true),
  getAddress: vi.fn().mockResolvedValue('GCMAYAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
}));

vi.mock('@stellar/stellar-sdk', () => ({
  Horizon: {
    Server: vi.fn().mockImplementation(() => ({
      loadAccount: vi.fn().mockResolvedValue({
        balances: [{ asset_type: 'native', balance: '150.00' }]
      })
    }))
  }
}));
import { App } from './App';

function renderApp() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>
  );
}

describe('EscrowX Pro+ frontend', () => {
  it('renders the dashboard analytics', () => {
    renderApp();
    expect(screen.getByText('Analytics dashboard')).toBeInTheDocument();
    expect(screen.getByText('Total Volume')).toBeInTheDocument();
  });

  it('opens the create escrow workflow', async () => {
    renderApp();
    await userEvent.click(screen.getByRole('button', { name: /Create Job/i }));
    expect(screen.getByText('Create milestone escrow')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Landing page redesign')).toBeInTheDocument();
  });

  it('shows wallet connection state', async () => {
    renderApp();
    await userEvent.click(screen.getByRole('button', { name: /Connect wallet/i }));
    expect(await screen.findByRole('button', { name: /GCMAYA/i })).toBeInTheDocument();
  });
});
