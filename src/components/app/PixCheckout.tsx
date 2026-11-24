import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatarReais, gerarPixCopiaECola, PRECO_SENSI } from "@/lib/pix";
import { linkWhatsApp, whatsappValido } from "@/lib/whatsapp";

export function useConfig() {
  return useQuery({
    queryKey: ["config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("config").select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function PixCheckout({
  sensi,
  aberto,
  onOpenChange,
  whatsappPadrao,
}: {
  sensi: { id: string; modelo: string; preco: number };
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
  whatsappPadrao: string;
}) {
  const qc = useQueryClient();
  const { data: config, isLoading } = useConfig();
  const [whats, setWhats] = useState(whatsappPadrao);
  const [qr, setQr] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const valor = Number(sensi.preco) || PRECO_SENSI;

  useEffect(() => setWhats(whatsappPadrao), [whatsappPadrao]);

  const copiaECola = useMemo(() => {
    if (!config?.chave_pix) return null;
    return gerarPixCopiaECola({
      chave: config.chave_pix,
      nome: config.nome_recebedor,
      cidade: config.cidade,
      valor,
      txid: `RS${sensi.id.replace(/-/g, "").slice(0, 10)}`,
    });
  }, [config, valor, sensi.id]);

  useEffect(() => {
    if (!copiaECola) return setQr(null);
    QRCode.toDataURL(copiaECola, { margin: 1, width: 280, color: { dark: "#0a0a0a", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [copiaECola]);

  async function copiar(texto: string) {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    toast.success("Copiado!");
    setTimeout(() => setCopiado(false), 2000);
  }

  async function jaFizOPix() {
    if (!whatsappValido(whats)) return void toast.error("Digite seu WhatsApp com DDD.");
    setEnviando(true);
    const { error } = await supabase.from("pedidos").insert({ sensi_id: sensi.id, whatsapp_cliente: whats.trim() });
    setEnviando(false);
    if (error) return void toast.error("Não foi possível registrar o pedido.");
    qc.invalidateQueries({ queryKey: ["meus-pedidos"] });
    toast.success("Pedido enviado! Aguarde a aprovação.");
    onOpenChange(false);
    if (config?.whatsapp) {
      const texto = `Fala! Já fiz o PIX de ${formatarReais(valor)} da sensi *${sensi.modelo}* no RED SENSI PRO FF. Meu WhatsApp: ${whats.trim()}. Segue o comprovante:`;
      const url = linkWhatsApp(config.whatsapp, texto);
      const janela = window.open(url, "_blank");
      if (janela) janela.opener = null;
      else window.location.href = url;
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-sm overflow-y-auto border-primary/40 bg-popover">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl uppercase">Pagar com PIX</DialogTitle>
          <DialogDescription>
            Sensi <strong className="text-foreground">{sensi.modelo}</strong> por{" "}
            <strong className="neon-text">{formatarReais(valor)}</strong>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <Loader2 className="mx-auto animate-spin text-primary" />
        ) : !config?.chave_pix ? (
          <p className="rounded-lg border border-warning/50 p-3 text-sm text-warning">
            A chave PIX ainda não foi configurada pelo admin. Tente mais tarde.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-fit rounded-xl bg-foreground p-2 neon-box">
              {qr ? <img src={qr} alt="QR Code PIX" className="size-56" /> : <div className="size-56" />}
            </div>
            <div className="space-y-1.5">
              <Label className="font-display text-base uppercase">Chave PIX</Label>
              <div className="flex gap-2">
                <Input readOnly value={config.chave_pix} className="bg-card" />
                <Button size="icon" variant="secondary" aria-label="Copiar chave" onClick={() => copiar(config.chave_pix)}>
                  {copiado ? <Check /> : <Copy />}
                </Button>
              </div>
            </div>
            {copiaECola && (
              <Button variant="neonOutline" className="w-full" onClick={() => copiar(copiaECola)}>
                <Copy /> COPIAR PIX COPIA E COLA
              </Button>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="whats-pix" className="font-display text-base uppercase">Seu WhatsApp</Label>
              <Input id="whats-pix" type="tel" value={whats} onChange={(e) => setWhats(e.target.value)} placeholder="(11) 99999-9999" className="bg-card" />
            </div>
            <Button variant="neon" size="xl" className="w-full" disabled={enviando} onClick={jaFizOPix}>
              {enviando && <Loader2 className="animate-spin" />} JÁ FIZ O PIX
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Seu pedido fica pendente até o admin confirmar. Depois a tabela libera aqui.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
