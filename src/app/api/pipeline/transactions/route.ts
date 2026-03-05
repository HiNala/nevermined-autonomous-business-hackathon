import { ledger } from "@/lib/agent/transactions";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send recent transactions as initial batch
      const recent = ledger.getRecent(30);
      for (const tx of recent) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(tx)}\n\n`));
      }

      // Subscribe to new transactions
      const unsubscribe = ledger.subscribe((tx) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(tx)}\n\n`));
        } catch {
          unsubscribe();
        }
      });

      // Keepalive
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch {
          clearInterval(keepalive);
          unsubscribe();
        }
      }, 30000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
