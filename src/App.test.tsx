import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
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
    expect(screen.getByRole('button', { name: /GCMAYA/i })).toBeInTheDocument();
  });
});
