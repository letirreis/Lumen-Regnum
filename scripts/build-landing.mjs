// Gera as 4 páginas de venda estáticas em public/ (pt e en, cada uma com versão "comprar" e "lista de espera").
// Uso: npm run build:landing     (depois faça commit dos arquivos gerados)
// Para mudar textos, preços ou a data de lançamento, edite as constantes abaixo e rode de novo.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

// ---- Configuração ---------------------------------------------------------------------------
// Data de lançamento para a versão "lista de espera" (formato AAAA-MM-DD). null = mostra "Em breve".
const LAUNCH_DATE = null;

const PRICES = {
  'pt-BR': { free: 'Grátis', starter: 'R$ 14,90', full: 'R$ 39,90', per: '/mês' },
  en: { free: 'Free', starter: 'US$ 5', full: 'US$ 12', per: '/month' },
};

// ---- Textos ---------------------------------------------------------------------------------
const COPY = {
  'pt-BR': {
    htmlLang: 'pt-BR',
    title: 'Lumen Regnum: o gerenciador de campanhas para quem mestra RPG de mesa',
    description: 'Organize NPCs, locais, segredos, sessões e combates da sua campanha de RPG de mesa em um só lugar. Comece grátis.',
    navFeatures: 'Recursos', navPricing: 'Planos', navFaq: 'Dúvidas', navLogin: 'Entrar', otherLang: 'English', otherLangHref: 'en',
    eyebrow: 'Para quem mestra',
    h1: 'Prepare sessões memoráveis sem se perder nas anotações.',
    lead: 'O Lumen Regnum reúne NPCs, locais, facções, segredos, sessões e combates da sua campanha de RPG de mesa em um só lugar, pensado para o mestre.',
    ctaBuy: 'Começar grátis', ctaBuy2: 'Ver os planos', haveAccount: 'Já tenho conta',
    ctaWait: 'Quero ser avisado', waitHeadline: 'Entre na lista de espera',
    waitSub: 'Deixe seu e-mail e avisamos quando abrirmos as portas. Só usaremos o e-mail para isso.',
    launch: (d) => (d ? `Lançamento: ${d}` : 'Lançamento em breve'),
    emailLabel: 'Seu e-mail', emailPh: 'voce@email.com', waitBtn: 'Entrar na lista', sending: 'Enviando...',
    waitOk: 'Pronto! Você está na lista. Avisaremos por e-mail.', waitErr: 'Não deu certo agora. Confira o e-mail e tente de novo.', waitRate: 'Muitas tentativas. Tente de novo em alguns minutos.',
    stripTitle: 'Menos abas abertas, mais mesa.',
    stripText: 'Caderno, planilha, documento solto: tudo vira um mundo organizado, que você encontra na hora em que a história pede.',
    featTitle: 'Tudo o que o mestre precisa na mesa',
    features: [
      ['Códex do mundo', 'Arco principal, tramas, história, magia e tecnologia, política, tom e estética, linha do tempo e regras da casa. Seu mundo todo em um lugar.'],
      ['Segredos do mestre', 'Cadastre verdades ocultas e reviravoltas, e ligue cada segredo às cenas em que podem ser descobertos.'],
      ['Sessões e cenas', 'Planeje cada sessão em cenas, defina o que os jogadores devem viver ou descobrir e acompanhe tudo em um calendário.'],
      ['Foco no Mestre', 'Uma visão enxuta da campanha, com o que importa para a próxima sessão e sem ruído.'],
      ['Fichas e etiquetas', 'NPCs, personagens, monstros, locais, facções e itens, com etiquetas para achar qualquer coisa rápido.'],
      ['Encontros e combate', 'Monte encontros com criaturas e conduza o combate sem sair da ferramenta.'],
      ['Rolador de dados', 'Escolha a quantidade, o dado e o modificador. Os dados rolam na tela e o histórico fica guardado.'],
      ['Imagens e mapas', 'Retrato para cada ficha, até 6 mapas por local e uma galeria da campanha com filtros e tela cheia.'],
      ['Seus dados são seus', 'Faça backup da campanha em arquivo e use em português ou inglês, com o idioma salvo na sua conta.'],
    ],
    diceTitle: 'Dados que rolam de verdade',
    diceText: 'Precisa de 8d6 para o dano de uma bola de fogo? Escolha a quantidade e confirme: os dados entram girando na tela, param no resultado e o total aparece em seguida. Um 20 natural no d20 brilha em dourado.',
    diceAlt: 'Oito dados de seis faces rolados na tela, com o total 30',
    priceTitle: 'Planos simples, comece de graça',
    priceSub: 'Cobrança mensal, cancele quando quiser. A moeda final aparece na tela de pagamento.',
    launchPriceTag: 'Preço de lançamento',
    tiers: [
      { id: 'free', name: 'Explorador', blurb: 'Para conhecer a ferramenta.', cta: 'Criar conta grátis', features: ['1 campanha', 'Até 10 fichas de cada tipo', 'Até 5 sessões', 'Rolador de dados e Códex'] },
      { id: 'starter', name: 'Starter', blurb: 'Para quem mestra toda semana.', cta: 'Assinar Starter', features: ['Até 3 campanhas', 'Até 1.500 fichas de cada tipo', 'Imagens e mapas (50 MB)', 'Backup da campanha'], featured: true },
      { id: 'full', name: 'Full', blurb: 'Tudo liberado, com recursos futuros.', cta: 'Assinar Full', features: ['Até 100 campanhas', 'Até 5.000 fichas de cada tipo', 'Imagens e mapas (200 MB)', 'Backup da campanha', 'Novidades em primeira mão'] },
    ],
    compareTitle: 'Comparar em detalhes',
    compareHead: ['', 'Explorador', 'Starter', 'Full'],
    compareRows: [
      ['Campanhas', '1', '3', '100'],
      ['Fichas de cada tipo (NPCs, locais, facções, itens, monstros, personagens)', '10', '1.500', '5.000'],
      ['Sessões', '5', '1.000', '3.000'],
      ['Cenas', '40', '5.000', '15.000'],
      ['Encontros', '5', '500', '2.000'],
      ['Imagens e mapas', '—', '50 MB', '200 MB'],
      ['Backup da campanha', '—', '✓', '✓'],
      ['Link só de leitura para jogadores', '—', '—', 'em breve'],
      ['IA: sugestão de ficha e resumo de sessão', '—', '—', 'em breve'],
      ['Co-mestre', '—', '—', 'em breve'],
    ],
    soonTitle: 'O que vem por aí',
    soonText: 'Link somente leitura para seus jogadores, IA para sugerir fichas e resumir sessões, e co-mestre. Chegam primeiro no plano Full.',
    faqTitle: 'Dúvidas frequentes',
    faq: [
      ['Preciso pagar para começar?', 'Não. O plano Explorador é grátis e não pede cartão. Quando sua campanha crescer, você assina o Starter ou o Full.'],
      ['Posso cancelar quando quiser?', 'Sim. Você gerencia a assinatura dentro do próprio app, pelo portal de pagamento, e cancela a qualquer momento.'],
      ['O que acontece com meus dados se eu cancelar?', 'Nada é apagado. Você volta ao plano gratuito, e o que já existe continua ali; só não dá para criar acima do limite do plano.'],
      ['Funciona com qual sistema de RPG?', 'O Lumen Regnum é focado na história e na mesa, não em regras de um sistema específico. Você descreve suas fichas como quiser.'],
      ['Meus jogadores precisam de conta?', 'Hoje o app é do mestre. O link somente leitura para jogadores está a caminho.'],
      ['Meus dados ficam seguros?', 'Cada conta só enxerga as próprias campanhas, e os limites de cada plano são aplicados no servidor.'],
    ],
    finalTitle: 'Sua próxima sessão começa aqui.',
    finalBuy: 'Criar minha conta grátis', finalWait: 'Entrar na lista de espera',
    footer: 'Lumen Regnum · Gerenciador de campanhas para mestres de RPG de mesa',
    logoAria: 'Lumen Regnum, página inicial',
  },
  en: {
    htmlLang: 'en',
    title: 'Lumen Regnum: the campaign manager for tabletop RPG game masters',
    description: 'Keep your tabletop RPG campaign\'s NPCs, locations, secrets, sessions and combat in one place. Start free.',
    navFeatures: 'Features', navPricing: 'Plans', navFaq: 'FAQ', navLogin: 'Sign in', otherLang: 'Português', otherLangHref: 'pt',
    eyebrow: 'Made for game masters',
    h1: 'Prepare unforgettable sessions without drowning in notes.',
    lead: 'Lumen Regnum brings the NPCs, locations, factions, secrets, sessions and combat of your tabletop RPG campaign into one place, built around the game master.',
    ctaBuy: 'Start for free', ctaBuy2: 'See the plans', haveAccount: 'I already have an account',
    ctaWait: 'Notify me', waitHeadline: 'Join the waiting list',
    waitSub: 'Leave your email and we will tell you when the doors open. We only use it for that.',
    launch: (d) => (d ? `Launching ${d}` : 'Launching soon'),
    emailLabel: 'Your email', emailPh: 'you@email.com', waitBtn: 'Join the list', sending: 'Sending...',
    waitOk: 'Done! You are on the list. We will email you.', waitErr: 'That did not work. Check your email and try again.', waitRate: 'Too many attempts. Try again in a few minutes.',
    stripTitle: 'Fewer tabs, more table.',
    stripText: 'Notebook, spreadsheet, scattered docs: all of it becomes one organized world you can find the moment the story asks for it.',
    featTitle: 'Everything a game master needs at the table',
    features: [
      ['World codex', 'Main arc, plots, history, magic and technology, politics, tone and aesthetics, timeline and house rules. Your whole world in one place.'],
      ['GM secrets', 'Record hidden truths and twists, and link each secret to the scenes where players might uncover it.'],
      ['Sessions and scenes', 'Plan each session as scenes, set what players should live or discover, and follow it all on a calendar.'],
      ['GM Focus', 'A lean view of your campaign: what matters for the next session, with no noise.'],
      ['Sheets and tags', 'NPCs, characters, monsters, locations, factions and items, with tags to find anything fast.'],
      ['Encounters and combat', 'Build encounters with creatures and run combat without leaving the tool.'],
      ['Dice roller', 'Pick the count, the die and the modifier. The dice roll on screen and the log is kept.'],
      ['Images and maps', 'A portrait for every sheet, up to 6 maps per location, and a campaign gallery with filters and full screen.'],
      ['Your data is yours', 'Back up the campaign to a file and use it in English or Portuguese, with your language saved to your account.'],
    ],
    diceTitle: 'Dice that actually roll',
    diceText: 'Need 8d6 for the damage of a fireball? Pick the count and confirm: the dice tumble onto the screen, land on the result, and the total appears. A natural 20 on a d20 glows gold.',
    diceAlt: 'Eight six-sided dice rolled on screen, with a total of 30',
    priceTitle: 'Simple plans, start free',
    priceSub: 'Billed monthly, cancel anytime. The final currency is shown at checkout.',
    launchPriceTag: 'Launch price',
    tiers: [
      { id: 'free', name: 'Explorer', blurb: 'To get to know the tool.', cta: 'Create a free account', features: ['1 campaign', 'Up to 10 sheets of each type', 'Up to 5 sessions', 'Dice roller and codex'] },
      { id: 'starter', name: 'Starter', blurb: 'For GMs who run games every week.', cta: 'Subscribe to Starter', features: ['Up to 3 campaigns', 'Up to 1,500 sheets of each type', 'Images and maps (50 MB)', 'Campaign backup'], featured: true },
      { id: 'full', name: 'Full', blurb: 'Everything unlocked, with upcoming features.', cta: 'Subscribe to Full', features: ['Up to 100 campaigns', 'Up to 5,000 sheets of each type', 'Images and maps (200 MB)', 'Campaign backup', 'New features first'] },
    ],
    compareTitle: 'Compare in detail',
    compareHead: ['', 'Explorer', 'Starter', 'Full'],
    compareRows: [
      ['Campaigns', '1', '3', '100'],
      ['Sheets of each type (NPCs, locations, factions, items, monsters, characters)', '10', '1,500', '5,000'],
      ['Sessions', '5', '1,000', '3,000'],
      ['Scenes', '40', '5,000', '15,000'],
      ['Encounters', '5', '500', '2,000'],
      ['Images and maps', '—', '50 MB', '200 MB'],
      ['Campaign backup', '—', '✓', '✓'],
      ['Read-only link for players', '—', '—', 'coming soon'],
      ['AI: sheet suggestions and session summaries', '—', '—', 'coming soon'],
      ['Co-GM', '—', '—', 'coming soon'],
    ],
    soonTitle: 'What is coming',
    soonText: 'A read-only link for your players, AI to suggest sheets and summarize sessions, and a co-GM. They arrive first on the Full plan.',
    faqTitle: 'Frequently asked questions',
    faq: [
      ['Do I have to pay to start?', 'No. The Explorer plan is free and asks for no card. When your campaign grows, you subscribe to Starter or Full.'],
      ['Can I cancel anytime?', 'Yes. You manage your subscription inside the app through the billing portal and can cancel at any time.'],
      ['What happens to my data if I cancel?', 'Nothing is deleted. You go back to the free plan and what already exists stays; you just cannot create beyond the plan limit.'],
      ['Which RPG system does it work with?', 'Lumen Regnum focuses on story and table prep, not on the rules of a specific system. You describe your sheets however you like.'],
      ['Do my players need an account?', 'Today the app is for the game master. A read-only link for players is on the way.'],
      ['Is my data safe?', 'Each account only sees its own campaigns, and the limits of each plan are enforced on the server.'],
    ],
    finalTitle: 'Your next session starts here.',
    finalBuy: 'Create my free account', finalWait: 'Join the waiting list',
    footer: 'Lumen Regnum · Campaign manager for tabletop RPG game masters',
    logoAria: 'Lumen Regnum, home',
  },
};

// ---- Geração --------------------------------------------------------------------------------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const crown = '<svg class="crown" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 18h18v2H3v-2Zm0-2L1 7l5.5 4L12 4l5.5 7L23 7l-2 9H3Z" fill="currentColor"/></svg>';

function launchText(locale, c) {
  if (!LAUNCH_DATE) return c.launch(null);
  const d = new Date(`${LAUNCH_DATE}T12:00:00`);
  return c.launch(d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }));
}

function appLink(locale, plan) {
  const lang = locale === 'en' ? 'en' : 'pt-BR';
  return `/#/?mode=signup&plan=${plan}&lang=${lang}`;
}

function page(locale, variant) {
  const c = COPY[locale];
  const price = PRICES[locale];
  const buy = variant === 'buy';
  const short = locale === 'en' ? 'en' : 'pt';
  const waitPath = locale === 'en' ? 'waitlist' : 'lista-de-espera';
  const selfPath = buy ? `/${short}/` : `/${short}/${waitPath}/`;
  const otherShort = c.otherLangHref;
  const otherWaitPath = otherShort === 'en' ? 'waitlist' : 'lista-de-espera';
  const otherHref = buy ? `/${otherShort}/` : `/${otherShort}/${otherWaitPath}/`;
  const loginHref = `/#/?lang=${locale === 'en' ? 'en' : 'pt-BR'}`;
  const source = `${buy ? 'sales' : 'waitlist'}-${short}`;

  const waitForm = (id) => `
        <form class="wait-form" data-wait-form data-lang="${locale === 'en' ? 'en' : 'pt-BR'}" data-source="${source}-${id}" novalidate
              data-sending="${esc(c.sending)}" data-ok="${esc(c.waitOk)}" data-err="${esc(c.waitErr)}" data-rate="${esc(c.waitRate)}">
          <label class="sr-only" for="email-${id}">${esc(c.emailLabel)}</label>
          <input id="email-${id}" name="email" type="email" inputmode="email" autocomplete="email" required placeholder="${esc(c.emailPh)}">
          <input class="hp" name="website" type="text" tabindex="-1" autocomplete="off" aria-hidden="true">
          <button class="btn btn-gold" type="submit">${esc(c.waitBtn)}</button>
          <p class="wait-msg" role="status" aria-live="polite"></p>
        </form>`;

  const heroActions = buy
    ? `<div class="actions"><a class="btn btn-gold" href="${appLink(locale, 'free')}">${esc(c.ctaBuy)}</a><a class="btn btn-ghost" href="#pricing">${esc(c.ctaBuy2)}</a></div>
       <p class="muted small"><a href="${loginHref}">${esc(c.haveAccount)}</a></p>`
    : `<div class="wait-box"><h2 class="wait-title">${esc(c.waitHeadline)}</h2><p class="muted">${esc(c.waitSub)}</p>${waitForm('hero')}<p class="launch">${esc(launchText(locale, c))}</p></div>`;

  const tiers = c.tiers.map((t) => `
        <article class="tier${t.featured ? ' featured' : ''}">
          ${!buy && t.id !== 'free' ? `<span class="badge">${esc(c.launchPriceTag)}</span>` : ''}
          <h3>${esc(t.name)}</h3>
          <p class="muted">${esc(t.blurb)}</p>
          <p class="price"><span class="amount">${esc(price[t.id])}</span>${t.id === 'free' ? '' : `<span class="per">${esc(price.per)}</span>`}</p>
          <ul>${t.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
          ${buy ? `<a class="btn ${t.featured ? 'btn-gold' : 'btn-ghost'}" href="${appLink(locale, t.id)}">${esc(t.cta)}</a>` : ''}
        </article>`).join('');

  const rows = c.compareRows.map((r) => `<tr><th scope="row">${esc(r[0])}</th>${r.slice(1).map((v) => `<td>${esc(v)}</td>`).join('')}</tr>`).join('');

  return `<!DOCTYPE html>
<html lang="${c.htmlLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(c.title)}</title>
  <meta name="description" content="${esc(c.description)}">
  <meta property="og:title" content="${esc(c.title)}">
  <meta property="og:description" content="${esc(c.description)}">
  <meta property="og:type" content="website">
  <meta name="theme-color" content="#1A1B23">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M3 18h18v2H3v-2Zm0-2L1 7l5.5 4L12 4l5.5 7L23 7l-2 9H3Z' fill='%23D4B875'/%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/landing/landing.css">
</head>
<body>
  <header class="top">
    <a class="logo" href="${selfPath}" aria-label="${esc(c.logoAria)}">${crown}<span>LUMEN REGNUM</span></a>
    <nav aria-label="Principal">
      <a href="#features">${esc(c.navFeatures)}</a>
      <a href="#pricing">${esc(c.navPricing)}</a>
      <a href="#faq">${esc(c.navFaq)}</a>
      <a class="lang" href="${otherHref}" hreflang="${otherShort === 'en' ? 'en' : 'pt-BR'}">${esc(c.otherLang)}</a>
      ${buy ? `<a class="btn btn-small btn-ghost" href="${loginHref}">${esc(c.navLogin)}</a>` : ''}
    </nav>
  </header>

  <main>
    <section class="hero">
      <p class="eyebrow">${esc(c.eyebrow)}</p>
      <h1>${esc(c.h1)}</h1>
      <p class="lead">${esc(c.lead)}</p>
      ${heroActions}
    </section>

    <section class="strip">
      <h2>${esc(c.stripTitle)}</h2>
      <p>${esc(c.stripText)}</p>
    </section>

    <section id="features" class="section">
      <h2 class="section-title">${esc(c.featTitle)}</h2>
      <div class="grid">
        ${c.features.map((f) => `<article class="card"><h3>${esc(f[0])}</h3><p>${esc(f[1])}</p></article>`).join('\n        ')}
      </div>
    </section>

    <section class="section showcase">
      <div class="showcase-text">
        <h2 class="section-title left">${esc(c.diceTitle)}</h2>
        <p>${esc(c.diceText)}</p>
      </div>
      <img src="/landing/dice.png" width="760" height="260" loading="lazy" alt="${esc(c.diceAlt)}">
    </section>

    <section id="pricing" class="section">
      <h2 class="section-title">${esc(c.priceTitle)}</h2>
      <p class="center muted">${esc(c.priceSub)}</p>
      <div class="tiers">${tiers}
      </div>

      <h3 class="compare-title">${esc(c.compareTitle)}</h3>
      <div class="table-wrap">
        <table>
          <thead><tr>${c.compareHead.map((h, i) => `<th scope="col"${i === 0 ? ' class="sr-only"' : ''}>${esc(h || (locale === 'en' ? 'Feature' : 'Recurso'))}</th>`).join('')}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>

    <section class="section soon">
      <h2 class="section-title">${esc(c.soonTitle)}</h2>
      <p class="center">${esc(c.soonText)}</p>
    </section>

    <section id="faq" class="section narrow">
      <h2 class="section-title">${esc(c.faqTitle)}</h2>
      ${c.faq.map((f) => `<details><summary>${esc(f[0])}</summary><p>${esc(f[1])}</p></details>`).join('\n      ')}
    </section>

    <section class="final">
      <h2>${esc(c.finalTitle)}</h2>
      ${buy
        ? `<a class="btn btn-gold btn-big" href="${appLink(locale, 'free')}">${esc(c.finalBuy)}</a>`
        : `<p class="muted">${esc(c.waitSub)}</p>${waitForm('final')}<p class="launch">${esc(launchText(locale, c))}</p>`}
    </section>
  </main>

  <footer>
    <p>${esc(c.footer)}</p>
  </footer>
  <script src="/landing/landing.js" defer></script>
</body>
</html>
`;
}

const outputs = [
  ['pt/index.html', 'pt-BR', 'buy'],
  ['pt/lista-de-espera/index.html', 'pt-BR', 'waitlist'],
  ['en/index.html', 'en', 'buy'],
  ['en/waitlist/index.html', 'en', 'waitlist'],
];
for (const [file, locale, variant] of outputs) {
  const full = join(ROOT, file);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, page(locale, variant));
  console.log('gerado', file);
}
