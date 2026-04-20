import { db } from "./db";
import { promiseDeliveryState } from "@shared/schema";
import { eq } from "drizzle-orm";
import promises from "../client/src/promises/promises.json";

export interface PromiseEntry {
  id: number;
  heading: string;
  text: string;
  reference: string;
}

const allPromises: PromiseEntry[] = promises as PromiseEntry[];

const fallbackPromiseState = {
  id: 0,
  lastIndex: 0,
  isEnabled: true,
  lastSentTime: null as Date | null,
};

async function getOrCreateState() {
  try {
    const rows = await db.select().from(promiseDeliveryState).limit(1);
    if (rows.length === 0) {
      const [newState] = await db.insert(promiseDeliveryState).values({
        lastIndex: 0,
        isEnabled: true,
      }).returning();
      return newState;
    }
    return rows[0];
  } catch (err) {
    console.warn("[Promise] Database unavailable, using in-memory fallback state", err);
    return fallbackPromiseState;
  }
}

export async function getCurrentPromise(): Promise<{ promise: PromiseEntry; index: number; isEnabled: boolean }> {
  const state = await getOrCreateState();
  const idx = state.lastIndex % allPromises.length;
  return {
    promise: allPromises[idx],
    index: idx,
    isEnabled: state.isEnabled,
  };
}

export async function getNextPromise(): Promise<{ promise: PromiseEntry; index: number }> {
  const state = await getOrCreateState();
  const nextIdx = (state.lastIndex + 1) % allPromises.length;
  return {
    promise: allPromises[nextIdx],
    index: nextIdx,
  };
}

export async function advancePromise(): Promise<{ promise: PromiseEntry; index: number }> {
  const state = await getOrCreateState();
  const nextIdx = (state.lastIndex + 1) % allPromises.length;

  if (state.id === 0) {
    fallbackPromiseState.lastIndex = nextIdx;
    fallbackPromiseState.lastSentTime = new Date();
  } else {
    await db.update(promiseDeliveryState)
      .set({ lastIndex: nextIdx, lastSentTime: new Date() })
      .where(eq(promiseDeliveryState.id, state.id));
  }

  return {
    promise: allPromises[nextIdx],
    index: nextIdx,
  };
}

export async function resetRotation(): Promise<void> {
  const state = await getOrCreateState();

  if (state.id === 0) {
    fallbackPromiseState.lastIndex = 0;
    fallbackPromiseState.lastSentTime = new Date();
    return;
  }

  await db.update(promiseDeliveryState)
    .set({ lastIndex: 0, lastSentTime: new Date() })
    .where(eq(promiseDeliveryState.id, state.id));
}

export async function toggleEnabled(enabled: boolean): Promise<boolean> {
  const state = await getOrCreateState();

  if (state.id === 0) {
    fallbackPromiseState.isEnabled = enabled;
    return enabled;
  }

  await db.update(promiseDeliveryState)
    .set({ isEnabled: enabled })
    .where(eq(promiseDeliveryState.id, state.id));
  return enabled;
}

export function getTotalPromises(): number {
  return allPromises.length;
}

export function getPromiseByIndex(idx: number): PromiseEntry {
  return allPromises[idx % allPromises.length];
}

export async function runScheduledAdvance(): Promise<void> {
  try {
    const state = await getOrCreateState();
    if (!state.isEnabled) return;

    const now = new Date();
    const lastSent = state.lastSentTime ? new Date(state.lastSentTime) : null;

    if (lastSent) {
      const hoursSinceLast = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLast < 9) return;
    }

    await advancePromise();
    console.log("[Promise] Auto-advanced to next promise");
  } catch (err) {
    console.error("[Promise] Scheduled advance error:", err);
  }
}

export function startPromiseScheduler(): void {
  runScheduledAdvance().catch(err => console.error("[Promise] Initial run error:", err));

  setInterval(() => {
    runScheduledAdvance().catch(err => console.error("[Promise] Scheduled run error:", err));
  }, 4 * 60 * 60 * 1000);

  console.log("[Promise] Scheduler started (checks every 4 hours, advances if 9+ hours since last)");
}
