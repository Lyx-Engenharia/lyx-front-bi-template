import { useQuery } from "@tanstack/react-query";
import { createSupabaseBrowser } from "./supabase";

// ──────────────────────────────────────────────────────────────
// Hooks BI — read-only via Supabase self-host
// Substitua pelos schemas/tabelas analíticas do seu BI.
// ──────────────────────────────────────────────────────────────

export type KpiVendas = {
  total: number;
  variacaoMensal: number;
  metaAtingida: number;
};

export const useKpiVendas = (periodo: { de: string; ate: string }) =>
  useQuery({
    queryKey: ["bi", "kpi-vendas", periodo],
    queryFn: async (): Promise<KpiVendas> => {
      const supabase = createSupabaseBrowser();
      const { data, error } = await supabase
        .from("kpi_vendas")
        .select("total, variacao_mensal, meta_atingida")
        .gte("data", periodo.de)
        .lte("data", periodo.ate)
        .single();
      if (error) throw error;
      return {
        total: data?.total ?? 0,
        variacaoMensal: data?.variacao_mensal ?? 0,
        metaAtingida: data?.meta_atingida ?? 0,
      };
    },
  });

export type SerieTemporal = { data: string; valor: number };

export const useSerieTemporal = (
  metrica: string,
  periodo: { de: string; ate: string },
) =>
  useQuery({
    queryKey: ["bi", "serie", metrica, periodo],
    queryFn: async (): Promise<SerieTemporal[]> => {
      const supabase = createSupabaseBrowser();
      const { data, error } = await supabase
        .from("serie_temporal")
        .select("data, valor")
        .eq("metrica", metrica)
        .gte("data", periodo.de)
        .lte("data", periodo.ate)
        .order("data", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

export type RankingItem = { nome: string; valor: number };

export const useRanking = (categoria: string, limit = 10) =>
  useQuery({
    queryKey: ["bi", "ranking", categoria, limit],
    queryFn: async (): Promise<RankingItem[]> => {
      const supabase = createSupabaseBrowser();
      const { data, error } = await supabase
        .from("ranking_view")
        .select("nome, valor")
        .eq("categoria", categoria)
        .order("valor", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
