import type { VercelRequest, VercelResponse } from "@vercel/node";

const API_BASE = "https://atenaspay.com.br/api/pix";
const json = (res: VercelResponse, status: number, body: unknown) => res.status(status).setHeader("Content-Type", "application/json; charset=utf-8").json(body);
function first(...values: unknown[]): string { for (const value of values) if (typeof value === "string" && value.trim()) return value; return ""; }
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return json(res, 405, { error: "Método não permitido" });
  const key = process.env.ATENASPAY_API_KEY;
  const siteUrl = process.env.APP_BASE_URL;
  if (!key || !siteUrl) return json(res, 500, { error: "Configure ATENASPAY_API_KEY e APP_BASE_URL nas variáveis da Vercel." });
  const amount = Number(req.body?.amount);
  const description = String(req.body?.description || "Assinatura Tia Camila").slice(0, 200);
  const externalId = String(req.body?.idempotency_key || `tc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`).slice(0, 120);
  if (!Number.isFinite(amount) || amount < 1) return json(res, 400, { error: "Valor inválido. O mínimo é R$ 1,00." });
  try {
    const upstream = await fetch(`${API_BASE}/create`, { method: "POST", headers: { "x-api-key": key, "Content-Type": "application/json" }, body: JSON.stringify({ amount: Number(amount.toFixed(2)), description, external_id: externalId, webhook_url: `${siteUrl.replace(/\/$/, "")}/api/webhooks/atenaspay`, expiration: 1800 }) });
    const payload: any = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return json(res, upstream.status, { error: payload?.message || payload?.error || "A Atenas Pay recusou a cobrança.", details: payload });
    const data = payload?.data ?? payload?.payment ?? payload;
    const identifier = first(data?.id, data?.txid, data?.transaction_id, data?.external_id, externalId);
    const pixCode = first(data?.pix_copia_cola, data?.pix_copy_paste, data?.copy_paste, data?.brcode, data?.pix_code, data?.emv);
    const pixImage = first(data?.pix_image, data?.qr_code_base64, data?.qr_code, data?.qrcode_image);
    if (!identifier || !pixCode) return json(res, 502, { error: "A resposta da Atenas Pay não trouxe o ID e o código Pix esperados. Confira o formato de resposta na documentação.", details: payload });
    return json(res, 200, { identifier, pix_code: pixCode, pix_image: pixImage, payment: data });
  } catch { return json(res, 502, { error: "Não foi possível conectar à Atenas Pay." }); }
}
