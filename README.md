# Landing Page — Petição Direito da Saúde (Falco Assessoria Jurídica)

Site estático de captação de leads para casos de Direito da Saúde (planos de saúde, negativas de cobertura, erro médico, etc.).

## O que faz

1. Cliente em potencial preenche o formulário (dados de contato + narrativa do caso + o que já sabe/tem em mãos).
2. O envio vai direto para a Edge Function `public-health-petition-intake` (no projeto Supabase do ERP), que:
   - grava um lead na tabela `petitions` (`source = 'landing_page'`, `status = 'lead_novo'`);
   - dispara em segundo plano a IA de rascunho (`ai-health-petition-agent`) para já deixar uma minuta pronta;
   - **nunca** devolve nem envia qualquer petição/documento para quem preencheu o formulário.
3. O rascunho aparece dentro do ERP, na aba "Leads da Landing Page" do módulo Petição Saúde, para revisão pessoal do advogado.

## Deploy (Easypanel / Docker Swarm)

Mesma mecânica já usada para `mcp-erp-falco`: Easypanel builda a imagem a partir deste repositório (Dockerfile na raiz) e publica via Traefik.

- Porta interna do container: `80` (definida no `Dockerfile`/`nginx.conf` — mesmo padrão usado em lp-motoboys/lp-rodoviarios).
- Não precisa de variáveis de ambiente — a chave usada no `index.html` é a **anon key pública** do Supabase (a mesma já exposta em `.github/workflows/djen_cron.yml` no repo do ERP), segura para uso client-side.
- Domínio sugerido: `peticao.falcotech.com.br` (subdomínio novo, mesma VPS do conector MCP).

## Pré-requisito no lado do Supabase

As duas Edge Functions que este site depende (`public-health-petition-intake` e `ai-health-petition-agent`) e a tabela `petitions` vivem no repositório do ERP (`FalcoAssessoriaJuridica/erp-falco-assessoria-juridica`), não neste. Elas precisam estar deployadas antes deste site funcionar de ponta a ponta.
