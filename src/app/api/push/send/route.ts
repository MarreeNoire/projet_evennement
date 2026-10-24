import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import webpush from 'web-push';

// Configuration VAPID (à mettre dans .env.local)
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@event.ci';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey as string, vapidPrivateKey as string);
}

interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  vibrate?: number[];
  data?: Record<string, unknown>;
  actions?: Array<{ action: string; title: string; icon?: string }>;
  requireInteraction?: boolean;
  tag?: string;
  url?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Seuls les admins/organisateurs peuvent envoyer des notifications
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    const role = (profile as any)?.role;
    if (!profile || !role || !['admin', 'organizer'].includes(role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      userIds,           // Cible spécifique
      eventId,           // Tous les participants d'un événement
      salonId,           // Tous les membres d'un salon
      broadcast = false, // Tous les utilisateurs
      payload 
    }: {
      userIds?: string[];
      eventId?: string;
      salonId?: string;
      broadcast?: boolean;
      payload: NotificationPayload;
    } = body;

    if (!payload) {
      return NextResponse.json({ error: 'Payload requis' }, { status: 400 });
    }

    let query = (supabase as any).from('push_subscriptions').select('subscription, user_id');

    if (broadcast) {
      // Tous les utilisateurs
    } else if (userIds?.length) {
      query = query.in('user_id', userIds);
    } else if (eventId) {
      // Participants confirmés de l'événement
      const { data: participants } = await supabase
        .from('orders')
        .select('user_id')
        .eq('event_id', eventId)
        .eq('status', 'paid');
      
      const participantIds = participants?.map(p => p.user_id) || [];
      if (participantIds.length === 0) {
        return NextResponse.json({ sent: 0, message: 'Aucun participant' });
      }
      query = query.in('user_id', participantIds);
    } else if (salonId) {
      // Membres du salon
      const { data: members } = await supabase
        .from('salon_members')
        .select('user_id')
        .eq('salon_id', salonId);
      
      const memberIds = members?.map(m => m.user_id) || [];
      if (memberIds.length === 0) {
        return NextResponse.json({ sent: 0, message: 'Aucun membre' });
      }
      query = query.in('user_id', memberIds);
    } else {
      return NextResponse.json({ error: 'Cible requise (userIds, eventId, salonId, ou broadcast)' }, { status: 400 });
    }

    const { data: subscriptions, error } = await query;
    if (error) throw error;

    if (!subscriptions?.length) {
      return NextResponse.json({ sent: 0, message: 'Aucune subscription trouvée' });
    }

    const notificationPayload = {
      ...payload,
      data: {
        ...payload.data,
        url: payload.url
      }
    };

    const results = await Promise.allSettled(
      (subscriptions as Array<{ subscription: unknown; user_id: string }>).map(async ({ subscription, user_id }) => {
        try {
          await webpush.sendNotification(
            subscription as unknown as PushSubscriptionJSON,
            JSON.stringify(notificationPayload)
          );
          return { user_id, success: true };
        } catch (err: any) {
          // Subscription expirée ou invalide → supprimer
          if (err.statusCode === 410 || err.statusCode === 404) {
            await (supabase as any)
              .from('push_subscriptions')
              .delete()
              .eq('user_id', user_id);
          }
          return { user_id, success: false, error: err.message };
        }
      })
    );

    const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - sent;

    return NextResponse.json({ sent, failed, total: results.length });
  } catch (err) {
    console.error('[Push] Erreur envoi:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}