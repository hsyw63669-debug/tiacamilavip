import type { VercelRequest, VercelResponse } from "@vercel/node";
const json = (res: VercelResponse, status: number, body: unknown) => res.status(status).setHeader("Content-Type", "application/json; charset=utf-8").json(body);
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return json(res, 405, { error: "Método não permitido" });
  const key = process.env.ATENASPAY_API_KEY;
  const id = String(req.query.identifier || "").trim();
  if (!key) return json(res, 500, { error: "Configure ATENASPAY_API_KEY na Vercel." });
  if (!id || id.length > 200) return json(res, 400, { error: "Identificador inválido." });
  try {
    const upstream = await fetch(`https://atenaspay.com.br/api/pix/${encodeURIComponent(id)}`, { headers: { "x-api-key": key } });
    const payload: any = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return json(res, upstream.status, { error: payload?.message || payload?.error || "Não foi possível consultar o Pix." });
    const payment = payload?.data ?? payload?.payment ?? payload;
    return json(res, 200, { payment: { ...payment, id: payment?.id || id, status: String(payment?.status || "pending").toLowerCase() } });
  } catch { return json(res, 502, { error: "Não foi possível consultar a Atenas Pay." }); }
}
