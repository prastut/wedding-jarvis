import { getSupabase } from '../db/client';

export interface DashboardStats {
  guests: {
    total: number;
    optedIn: number;
    optedOut: number;
    onboarded: number;
    onboardedPercent: number;
  };
  rsvp: {
    attending: number;
    notAttending: number;
    pending: number;
    totalHeadcount: number;
  };
  bySide: {
    groom: number;
    bride: number;
    notOnboarded: number;
  };
  byLanguage: {
    english: number;
    hindi: number;
    punjabi: number;
    notSet: number;
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

  // Onboarded = has both language and side set
  const { count: onboardedGuests } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .not('user_language', 'is', null)
    .not('user_side', 'is', null);

  // RSVP counts
  const { count: rsvpYes } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('rsvp_status', 'YES');

  const { count: rsvpNo } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('rsvp_status', 'NO');

  // Total headcount - sum of rsvp_guest_count for attending guests
  const { data: headcountData } = await supabase
    .from('guests')
    .select('rsvp_guest_count')
    .eq('rsvp_status', 'YES')
    .not('rsvp_guest_count', 'is', null);

  const totalHeadcount = (headcountData || []).reduce(
    (sum, g) => sum + (g.rsvp_guest_count || 0),
    0
  );

  // By side counts
  const { count: groomSide } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('user_side', 'GROOM');

  const { count: brideSide } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('user_side', 'BRIDE');

  // By language counts
  const { count: langEn } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('user_language', 'EN');

  const { count: langHi } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('user_language', 'HI');

  const { count: langPa } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('user_language', 'PA');

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

  const total = totalGuests || 0;
  const onboarded = onboardedGuests || 0;
  const rsvpPending = total - (rsvpYes || 0) - (rsvpNo || 0);

  return {
    guests: {
      total,
      optedIn: optedInGuests || 0,
      optedOut: total - (optedInGuests || 0),
      onboarded,
      onboardedPercent: total > 0 ? Math.round((onboarded / total) * 100) : 0,
    },
    rsvp: {
      attending: rsvpYes || 0,
      notAttending: rsvpNo || 0,
      pending: rsvpPending,
      totalHeadcount,
    },
    bySide: {
      groom: groomSide || 0,
      bride: brideSide || 0,
      notOnboarded: total - (groomSide || 0) - (brideSide || 0),
    },
    byLanguage: {
      english: langEn || 0,
      hindi: langHi || 0,
      punjabi: langPa || 0,
      notSet: total - (langEn || 0) - (langHi || 0) - (langPa || 0),
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
