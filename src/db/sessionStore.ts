import { Store, SessionData } from 'express-session';
import { getSupabase } from './client';

export class SupabaseSessionStore extends Store {
  private tableName = 'sessions';

  constructor() {
    super();
  }

  async get(
    sid: string,
    callback: (err: Error | null, session?: SessionData | null) => void
  ): Promise<void> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from(this.tableName)
        .select('sess, expire')
        .eq('sid', sid)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - session doesn't exist
          return callback(null, null);
        }
        return callback(new Error(error.message));
      }

      const row = data as { sess: SessionData; expire: string };

      // Check if session has expired
      if (new Date(row.expire) < new Date()) {
        await this.destroy(sid, () => {});
        return callback(null, null);
      }

      callback(null, row.sess);
    } catch (err) {
      callback(err as Error);
    }
  }

  async set(
    sid: string,
    session: SessionData,
    callback?: (err?: Error | null) => void
  ): Promise<void> {
    try {
      const supabase = getSupabase();
      const maxAge = session.cookie?.maxAge || 86400000; // Default 24 hours
      const expire = new Date(Date.now() + maxAge).toISOString();

      const { error } = await supabase.from(this.tableName).upsert(
        {
          sid,
          sess: session,
          expire,
        },
        { onConflict: 'sid' }
      );

      if (error) {
        return callback?.(new Error(error.message));
      }

      callback?.(null);
    } catch (err) {
      callback?.(err as Error);
    }
  }

  async destroy(sid: string, callback?: (err?: Error | null) => void): Promise<void> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from(this.tableName).delete().eq('sid', sid);

      if (error) {
        return callback?.(new Error(error.message));
      }

      callback?.(null);
    } catch (err) {
      callback?.(err as Error);
    }
  }

  async touch(
    sid: string,
    session: SessionData,
    callback?: (err?: Error | null) => void
  ): Promise<void> {
    try {
      const supabase = getSupabase();
      const maxAge = session.cookie?.maxAge || 86400000;
      const expire = new Date(Date.now() + maxAge).toISOString();

      const { error } = await supabase.from(this.tableName).update({ expire }).eq('sid', sid);

      if (error) {
        return callback?.(new Error(error.message));
      }

      callback?.(null);
    } catch (err) {
      callback?.(err as Error);
    }
  }

  // Clean up expired sessions (can be called periodically)
  async clearExpired(): Promise<void> {
    const supabase = getSupabase();
    await supabase.from(this.tableName).delete().lt('expire', new Date().toISOString());
  }
}
