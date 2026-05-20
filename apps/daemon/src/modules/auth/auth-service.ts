import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";

import type { AppDatabase } from "../../infra/database.js";
import { deviceBindings } from "../../infra/schema.js";

export type DeviceBinding = {
  id: string;
  deviceName: string | null;
  tokenHash: string;
  status: "active" | "revoked";
  createdAt: string;
  lastUsedAt: string | null;
};

const TOKEN_PREFIX = "ac_";

export class AuthService {
  constructor(private readonly db: AppDatabase) {}

  generateToken(): { plaintext: string; hash: string } {
    const raw = crypto.randomBytes(32).toString("hex");
    const plaintext = `${TOKEN_PREFIX}${raw}`;
    const hash = this.hashToken(plaintext);
    return { plaintext, hash };
  }

  hashToken(plaintext: string): string {
    return crypto.createHash("sha256").update(plaintext).digest("hex");
  }

  async createBinding(deviceName?: string): Promise<{ id: string; token: string }> {
    const { plaintext, hash } = this.generateToken();
    const id = uuidv7();
    const now = new Date().toISOString();

    await this.db.insert(deviceBindings).values({
      id,
      deviceName: deviceName ?? null,
      tokenHash: hash,
      status: "active",
      createdAt: now,
      lastUsedAt: null,
    });

    return { id, token: plaintext };
  }

  validateToken(token: string): DeviceBinding | null {
    const hash = this.hashToken(token);
    const binding = this.db
      .select()
      .from(deviceBindings)
      .where(eq(deviceBindings.tokenHash, hash))
      .get();

    if (!binding || binding.status !== "active") return null;
    return binding;
  }

  async revokeBinding(bindingId: string): Promise<void> {
    await this.db
      .update(deviceBindings)
      .set({ status: "revoked" })
      .where(eq(deviceBindings.id, bindingId));
  }

  listActive(): DeviceBinding[] {
    return this.db
      .select()
      .from(deviceBindings)
      .where(eq(deviceBindings.status, "active"))
      .all();
  }

  async touchLastUsed(bindingId: string): Promise<void> {
    await this.db
      .update(deviceBindings)
      .set({ lastUsedAt: new Date().toISOString() })
      .where(eq(deviceBindings.id, bindingId));
  }
}
