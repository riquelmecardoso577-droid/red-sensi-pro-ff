import { queryOptions, useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const PERFIL_COLS =
  "id,nome,foto,idade,nick_ff,patente,capas_hoje,capas_dia,capas_pendentes,capas_pendentes_dia,bio,verificado,created_at" as const;

export interface Perfil {
  id: string;
  nome: string;
  foto: string | null;
  idade: number;
  nick_ff: string;
  patente: string;
  capas_hoje: number;
  capas_dia: string;
  capas_pendentes: number;
  capas_pendentes_dia: string | null;
  bio: string;
  verificado: boolean;
  created_at: string;
}

export const AUTOR_COLS = "id,nome,foto,verificado,nick_ff" as const;
export type Autor = Pick<Perfil, "id" | "nome" | "foto" | "verificado" | "nick_ff">;

export const perfilQuery = (id: string) =>
  queryOptions({
    queryKey: ["perfil", id],
    queryFn: async (): Promise<Perfil | null> => {
      const { data, error } = await supabase.from("usuarios").select(PERFIL_COLS).eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Perfil | null;
    },
  });

/** Id do usuário logado (disponível dentro da área logada). */
export function useEuId(): string {
  const ctx = useRouteContext({ from: "/_authenticated" });
  return ctx.user.id;
}

export function useIsAdmin(userId: string | undefined) {
  return useQuery({
    queryKey: ["is-admin", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", { _user_id: userId!, _role: "admin" });
      if (error) throw error;
      return !!data;
    },
  });
}

export function useSeguindo(euId: string) {
  return useQuery({
    queryKey: ["seguindo", euId],
    queryFn: async () => {
      const { data, error } = await supabase.from("seguidores").select("seguido_id").eq("seguidor_id", euId);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.seguido_id));
    },
  });
}

export const PATENTES = [
  "Bronze",
  "Prata",
  "Ouro",
  "Platina",
  "Diamante",
  "Mestre",
  "Desafiante",
  "Grande Mestre",
] as const;
