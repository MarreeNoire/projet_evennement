-- Push Notifications Subscriptions
-- Stockage des subscriptions Web Push par utilisateur

begin;

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_updated_at 
ON public.push_subscriptions(updated_at DESC);

-- RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Politique : l'utilisateur ne voit que sa propre subscription
DROP POLICY IF EXISTS "Users can manage their own push subscription" ON public.push_subscriptions;
CREATE POLICY "Users can manage their own push subscription"
ON public.push_subscriptions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Politique : admins peuvent voir toutes les subscriptions (pour envoi)
-- Les rôles applicatifs vivent dans public.user_roles, pas dans profiles.
DROP POLICY IF EXISTS "Admins can view all push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Admins can view all push subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON public.push_subscriptions;
CREATE TRIGGER update_push_subscriptions_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

commit;