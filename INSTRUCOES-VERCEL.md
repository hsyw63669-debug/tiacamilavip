# Checkout Tia Camila — implantação Vercel

## O que foi organizado
- API privada para criar cobrança Pix em `/api/pix/create`.
- Consulta de status em `/api/pix/status?identifier=...`.
- Endpoint de webhook em `/api/webhooks/atenaspay`, com validação HMAC no formato `unix=<timestamp>,v1=<hex>`.
- O frontend usa rotas do mesmo domínio em vez de chamar diretamente a função Supabase de pagamento.
- A chave da API fica exclusivamente em variável de ambiente no servidor.

## Antes de publicar
1. Importe o projeto no Vercel e mantenha o framework Vite.
2. Em Settings → Environment Variables, crie `ATENASPAY_API_KEY`, `ATENASPAY_WEBHOOK_SECRET` e `APP_BASE_URL` (URL HTTPS final do site).
3. Use apenas a chave secreta no campo `ATENASPAY_API_KEY`; não a coloque no código ou em variável `VITE_*`.
4. Configure na Atenas Pay o webhook `https://SEU-DOMINIO/api/webhooks/atenaspay` e o segredo HMAC correspondente.
5. Faça uma cobrança de teste de baixo valor e confira a resposta real da API. A rota espera encontrar `id`/`txid` e `pix_copia_cola` (ou campos equivalentes comuns); se a resposta do gateway usar outros nomes, ajuste o mapeamento em `api/pix/create.ts`.
6. Confirme no painel da Atenas Pay qual é o algoritmo exato de assinatura. O código usa HMAC-SHA256 de `timestamp + "." + corpo bruto`, conforme o formato indicado no material enviado; se a especificação oficial divergir, não ative o webhook até ajustar.

## Importante
- Não foi possível testar cobranças reais sem as credenciais e sem uma resposta real da conta. Não considere a integração validada em produção até fazer o teste de ponta a ponta.
- O webhook valida e reconhece o evento; a tela consulta o endpoint autenticado de status para verificar `payment.status === "paid"`.
- O link do grupo Telegram é público para quem o possui. Para acesso VIP realmente controlado, use convites individuais/temporários criados por um bot no servidor.
