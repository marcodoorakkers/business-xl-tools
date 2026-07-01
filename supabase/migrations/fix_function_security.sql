-- Revoke EXECUTE op functies van publieke rollen
REVOKE EXECUTE ON FUNCTION public.add_credits(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- add_credits wordt aangeroepen vanuit de Stripe webhook via service role — expliciet toegang herstellen
GRANT EXECUTE ON FUNCTION public.add_credits(uuid, integer) TO service_role;

-- Fix mutable search_path op alle public functions
ALTER FUNCTION public.add_credits(uuid, integer) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.decrement_credits(uuid) SET search_path = public;
ALTER FUNCTION public.set_subscription_credits(uuid, integer) SET search_path = public;

-- Fix ideas UPDATE policy — beperkt tot eigen rijen
DROP POLICY IF EXISTS update_ideas ON public.ideas;
CREATE POLICY update_ideas ON public.ideas
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
