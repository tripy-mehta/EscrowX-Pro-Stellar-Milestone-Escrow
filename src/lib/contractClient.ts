import { io, type Socket } from 'socket.io-client';
import type { ActivityEvent } from '../types';

type Listener = (event: ActivityEvent) => void;

class LocalEventStream {
  private listeners = new Set<Listener>();
  private socket: Socket | null = null;

  connect() {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl || this.socket) return;
    this.socket = io(apiUrl, { transports: ['websocket'], autoConnect: true });
    this.socket.on('contract:event', (event: ActivityEvent) => this.emit(event));
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: ActivityEvent) {
    this.listeners.forEach((listener) => listener(event));
  }
}

export const eventStream = new LocalEventStream();

export const contractIds = {
  escrow: import.meta.env.VITE_ESCROW_CONTRACT_ID ?? 'CDUMMYESCROWXPROPLUSCONTRACTID',
  reputation: import.meta.env.VITE_REPUTATION_CONTRACT_ID ?? 'CDUMMYREPUTATIONCONTRACTID',
  dispute: import.meta.env.VITE_DISPUTE_CONTRACT_ID ?? 'CDUMMYDISPUTECONTRACTID'
};
