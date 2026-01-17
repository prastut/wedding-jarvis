import { getSupabase } from '../db/client';

export interface DashboardStats {
  guests: {
    total: number;
    optedIn: number;
    optedOut: number;
  };
  messages: {
    total: number;
    inbound: number;
    outbound: number;
  };
  broadcasts: {
    total: number;
    completed: number;
  };
  lastActivity: string | null;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = getSupabase();

  // Get guest counts
  const { count: totalGuests } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true });

  const { count: optedInGuests } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('opted_in', true);

  // Get message counts
  const { count: totalMessages } = await supabase
    .from('message_logs')
    .select('*', { count: 'exact', head: true });

  const { count: inboundMessages } = await supabase
    .from('message_logs')
    .select('*', { count: 'exact', head: true })
    .eq('direction', 'inbound');

  // Get last activity
  const { data: lastMessage } = await supabase
    .from('message_logs')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Get broadcast counts
  const { count: totalBroadcasts } = await supabase
    .from('broadcasts')
    .select('*', { count: 'exact', head: true });

  const { count: completedBroadcasts } = await supabase
    .from('broadcasts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  return {
    guests: {
      total: totalGuests || 0,
      optedIn: optedInGuests || 0,
      optedOut: (totalGuests || 0) - (optedInGuests || 0),
    },
    messages: {
      total: totalMessages || 0,
      inbound: inboundMessages || 0,
      outbound: (totalMessages || 0) - (inboundMessages || 0),
    },
    broadcasts: {
      total: totalBroadcasts || 0,
      completed: completedBroadcasts || 0,
    },
    lastActivity: lastMessage?.created_at || null,
  };
}
