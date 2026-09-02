# [LP SAUDE - MEMÓRIA DE PROJETO & CONTEXTO HISTÓRICO]

**Projeto**: Landing Page Trabalhista — Defesa dos Direitos dos Profissionais da Saúde  
**Repositório GitHub**: https://github.com/FalcoAssessoriaJuridica/lp-saude  
**Domínio de Produção**: https://saude.falcotech.com.br  
**Conversation ID de Origem**: 914e0592-525c-4e6c-a98e-e7e5e6d70f85  

---

## 🎯 PÚBLICO-ALVO & NICHOS DA SAÚDE
- **Enfermeiros, Técnicos de Enfermagem e Auxiliares**
- **Médicos, Plantonistas e Residentes**
- **Fisioterapeutas, Biomédicos e Profissionais de Laboratório**
- **Trabalhadores Administrativos e de Apoio Hospitalar**

---

## ⚖️ PRINCIPAIS TESES E DIREITOS TRABALHISTAS
1. **Adicional de Insalubridade em Grau Máximo (40%)**:
   - Contato permanente com pacientes portadores de doenças infectocontagiosas ou objetos de seu uso não previamente esterilizados (NR-15, Anexo 14 e Súmula 448 do TST).
2. **Horas Extras & Dobras de Plantão 12x36**:
   - Prorrogações habituais de jornada que descaracterizam a escala 12x36, gerando pagamento de todas as horas excedentes à 8ª diária como extras.
3. **Piso Salarial Nacional da Enfermagem (Lei 14.434/2022)**:
   - Cobrança de diferenças salariais retroativas e reflexos em verbas rescisórias, férias, 13º e FGTS.
4. **Intervalos Intrajornada Suprimidos & Descanso Especial**:
   - Não concessão regular do intervalo de 1h para refeição ou intervalos específicos de repouso.
5. **Dano Existencial & Síndrome de Burnout**:
   - Jornadas exaustivas continuadas gerando sobrecarga física/mental e indenização civil/trabalhista.

---

## ⚙️ INFRAESTRUTURA & DEPLOY (EASYPANEL / VPS)
- **Servidor Web**: Nginx estático (`nginx:stable-alpine`), ouvindo na porta **80** (EXPOSE 80).
- **Roteamento no Traefik (VPS)**:
  - Arquivo: `/etc/easypanel/traefik/config/falcotech-global-fix.yaml`
  - Rota de serviço: `http://tasks.falcotech_saude:80/`
- **Studio Visual (`falco-visual-studio.js`)**:
  - Trava estrita de ambiente: Ativo exclusivamente em `localhost` / `127.0.0.1` ou com `?studio=1`.
  - Inativo e não injetado em produção (`saude.falcotech.com.br`).
