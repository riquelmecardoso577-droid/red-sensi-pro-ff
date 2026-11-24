CREATE OR REPLACE FUNCTION public.perfil_completo(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.id = _user_id AND u.foto IS NOT NULL
  )
$$;

REVOKE ALL ON FUNCTION public.perfil_completo(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.perfil_completo(uuid) TO authenticated;

DROP POLICY IF EXISTS "sensis para logados" ON public.sensis;

CREATE POLICY "sensis para perfis completos"
ON public.sensis
FOR SELECT
TO authenticated
USING (
  public.perfil_completo(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);