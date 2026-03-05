import "server-only";

export interface AgentEvent {
  id: string;
  type: string;
  timestamp: string;
  data: Record<string, unknown>;
}

type Listener = (event: AgentEvent) => void;

class EventStore {
  private events: AgentEvent[] = [];
  private listeners: Set<Listener> = new Set();
  private maxEvents = 100;

  push(event: AgentEvent) {
    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // ignore listener errors
      }
    }
  }

  getRecent(count: number = 20): AgentEvent[] {
    return this.events.slice(-count);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  get totalCount() {
    return this.events.length;
  }
}

export const agentEvents = new EventStore();
