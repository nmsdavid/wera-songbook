-- Migration: Custom Access Token Hook
-- Embeds org_id, department_id, and role from org_members into the JWT.
-- This avoids an extra DB query on every request to check the user's role.
--
-- Supabase calls this function every time it issues or refreshes an access token.
-- The claims are then available via auth.jwt() -> 'app_metadata' in RLS policies
-- and via supabase.auth.getSession() on the client.

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB AS $$
DECLARE
  claims JSONB;
  user_org_id UUID;
  user_department_id UUID;
  user_role public.app_role;
BEGIN
  -- Extract the current claims from the event
  claims := event->'claims';

  -- Look up the user's membership (take the first match; one user = one org for now)
  SELECT om.org_id, om.department_id, om.role
  INTO user_org_id, user_department_id, user_role
  FROM public.org_members om
  WHERE om.user_id = (event->>'user_id')::UUID
  LIMIT 1;

  IF user_org_id IS NOT NULL THEN
    -- Set custom claims in app_metadata
    claims := jsonb_set(claims, '{app_metadata,org_id}', to_jsonb(user_org_id));
    claims := jsonb_set(claims, '{app_metadata,department_id}', to_jsonb(user_department_id));
    claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(user_role::TEXT));
  ELSE
    -- User has no membership yet – set empty values
    claims := jsonb_set(claims, '{app_metadata,org_id}', 'null'::JSONB);
    claims := jsonb_set(claims, '{app_metadata,department_id}', 'null'::JSONB);
    claims := jsonb_set(claims, '{app_metadata,role}', '"member"'::JSONB);
  END IF;

  -- Return the modified event with updated claims
  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission to supabase_auth_admin (required for hooks)
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(JSONB) TO supabase_auth_admin;

-- Revoke from public for security
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(JSONB) FROM anon;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(JSONB) FROM authenticated;

-- Grant usage on the app_role type to supabase_auth_admin
GRANT USAGE ON TYPE public.app_role TO supabase_auth_admin;
