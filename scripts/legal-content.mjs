// Textos das páginas de Privacidade e Termos de Uso (pt e en). Usado por scripts/build-landing.mjs.
// Para mudar algo, edite aqui e rode `npm run build:landing`.
//
// IMPORTANTE: revise com um(a) advogado(a) antes de divulgar. O texto descreve o que o app faz hoje
// (sem cookies de rastreamento, Supabase/Vercel/Stripe como provedores). Se isso mudar (pixels de anúncio,
// analytics, IA processando conteúdo), atualize estes textos e a data abaixo.

export const OPERATOR = {
  name: 'Leticia Cristina Reis',
  cnpj: '46.620.338/0001-47',
  // E-mail público de contato/privacidade. Enquanto for null, as páginas não exibem a seção de contato.
  contactEmail: null,
};

export const UPDATED = { 'pt-BR': '19 de outubro de 2026', en: 'October 19, 2026' };

const op = `${OPERATOR.name} (MEI), CNPJ ${OPERATOR.cnpj}`;

// Cada seção: [título, [parágrafos...]]. Parágrafo que começa com "• " vira item de lista.
export const LEGAL = {
  'pt-BR': {
    privacy: {
      slug: 'privacidade',
      title: 'Política de Privacidade',
      intro: 'Esta política explica quais dados o Lumen Regnum coleta, para que usamos e quais são os seus direitos, conforme a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018).',
      sections: [
        ['Quem é a controladora dos dados', [`O Lumen Regnum é operado por ${op}, que decide como seus dados pessoais são tratados.`]],
        ['Dados que coletamos', [
          '• Conta: e-mail, senha e idioma. A senha é guardada de forma protegida (hash) pelo provedor de autenticação; nós não a vemos.',
          '• Conteúdo da campanha: tudo o que você escreve ou envia no app (NPCs, locais, facções, segredos, sessões, notas, imagens e mapas).',
          '• Assinatura: identificadores do cliente e da assinatura no Stripe e o plano contratado. Os dados do cartão são tratados apenas pelo Stripe; não temos acesso a eles.',
          '• Lista de espera: e-mail, idioma, a página em que você se inscreveu e, quando houver, os parâmetros de campanha da URL (UTM), que indicam de qual anúncio ou link você veio.',
          '• Dados técnicos: registros de acesso gerados pela hospedagem (como endereço IP, data e hora), usados para segurança e funcionamento do serviço.',
        ]],
        ['Cookies e armazenamento no navegador', ['Não usamos cookies de rastreamento nem pixels de publicidade. O navegador guarda apenas o necessário para o app funcionar: sua sessão de login, o idioma escolhido e, durante o cadastro, o plano que você escolheu.']],
        ['Para que usamos e em que base legal', [
          '• Operar sua conta e entregar o serviço, e processar a assinatura (execução de contrato, art. 7º, V).',
          '• Avisar você quando o serviço abrir, se estiver na lista de espera (consentimento, art. 7º, I). Você pode retirar o consentimento a qualquer momento.',
          '• Manter a segurança, evitar abusos e entender de quais canais vêm os cadastros (legítimo interesse, art. 7º, IX).',
          '• Cumprir obrigações fiscais e legais (art. 7º, II).',
          'Não vendemos seus dados e não usamos o conteúdo das suas campanhas para publicidade. Se um dia recursos de IA passarem a processar o seu conteúdo, avisaremos antes e atualizaremos esta política.',
        ]],
        ['Com quem compartilhamos', [
          'Usamos prestadores que tratam dados em nosso nome, só para o que é necessário:',
          '• Supabase: autenticação, banco de dados e armazenamento de arquivos.',
          '• Vercel: hospedagem do site e das funções do servidor.',
          '• Stripe: processamento dos pagamentos e gestão das assinaturas.',
          'Também podemos divulgar dados se a lei ou uma ordem judicial exigir.',
        ]],
        ['Transferência internacional', ['Nossos prestadores armazenam e processam dados fora do Brasil, principalmente nos Estados Unidos (o banco de dados fica na região us-west-2, no estado do Oregon). Isso é feito com os prestadores acima, que adotam salvaguardas contratuais e de segurança, conforme o art. 33 da LGPD.']],
        ['Por quanto tempo guardamos', [
          '• Conta e campanhas: enquanto a conta existir. Ao excluir a conta pelo app, suas campanhas e o cadastro são apagados.',
          '• Lista de espera: até o lançamento ou até você pedir a remoção.',
          '• Dados de cobrança: pelo prazo exigido pela legislação fiscal e contábil.',
        ]],
        ['Seus direitos', [
          'Você pode pedir, a qualquer momento: confirmação de que tratamos seus dados; acesso; correção; anonimização, bloqueio ou eliminação de dados desnecessários; portabilidade; informação sobre com quem compartilhamos; e a revogação do consentimento. Também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).',
          'Dentro do app você pode exportar a campanha em arquivo (recurso do plano Starter) e excluir a sua conta.',
        ]],
        ['Segurança', ['Cada conta só enxerga os próprios dados, as conexões usam HTTPS e os limites de cada plano são aplicados no servidor. Nenhum sistema é totalmente seguro, mas trabalhamos para reduzir riscos e corrigir falhas com rapidez.']],
        ['Crianças e adolescentes', ['O serviço não é direcionado a crianças. Se soubermos que uma criança criou uma conta sem acompanhamento de responsável, podemos removê-la.']],
        ['Mudanças nesta política', ['Podemos atualizar esta política. A data no topo mostra a última revisão; mudanças relevantes serão avisadas no app ou por e-mail.']],
      ],
    },
    terms: {
      slug: 'termos',
      title: 'Termos de Uso',
      intro: 'Ao criar uma conta ou usar o Lumen Regnum, você concorda com estes termos. Eles valem em conjunto com a Política de Privacidade.',
      sections: [
        ['O serviço', [`O Lumen Regnum é um gerenciador de campanhas de RPG de mesa para mestres, operado por ${op}. Ele permite organizar mundo, personagens, segredos, sessões, encontros e mídias.`]],
        ['Sua conta', ['Você deve ter 18 anos ou mais, ou usar o serviço com o consentimento de um responsável. Mantenha sua senha em segurança: você responde pelo que acontece na sua conta. Informe-nos se suspeitar de uso indevido.']],
        ['Planos e pagamento', [
          '• O plano Explorador é gratuito e tem limites de uso, descritos na página de planos e no app.',
          '• O plano Starter é pago, com cobrança mensal recorrente pelo Stripe. A assinatura renova sozinha até ser cancelada.',
          '• Você cancela quando quiser pelo portal de pagamento dentro do app. O acesso segue até o fim do período já pago.',
          '• A moeda e o valor final aparecem na tela de pagamento. Mudanças de preço valem a partir do ciclo seguinte e são avisadas antes.',
        ]],
        ['Direito de arrependimento', ['Em contratações feitas pela internet, você pode desistir em até 7 dias corridos após assinar, com reembolso integral, conforme o art. 49 do Código de Defesa do Consumidor. Peça pelo contato indicado ao final desta página.']],
        ['Limites do plano e cancelamento', ['Ao voltar ao plano gratuito, nada é apagado: o que você já criou continua ali. Você só não consegue criar novos itens acima do limite do plano.']],
        ['Seu conteúdo', [
          'O conteúdo das suas campanhas é seu. Você nos autoriza apenas a armazená-lo e exibi-lo para você, para que o serviço funcione.',
          'Você declara ter os direitos sobre o que envia (como imagens e mapas) e não deve enviar conteúdo ilegal ou que viole direitos de terceiros.',
        ]],
        ['Uso aceitável', ['Não é permitido tentar burlar limites ou a segurança do serviço, acessar dados de outras contas, fazer extração automatizada em massa, nem sobrecarregar a infraestrutura.']],
        ['Recursos em desenvolvimento', ['Recursos descritos como "em breve" ou "a caminho" (como IA, co-mestre e link de leitura para jogadores) estão em desenvolvimento. São intenções, sem garantia de prazo, e não fazem parte do que você contrata hoje.']],
        ['Disponibilidade e mudanças', ['Trabalhamos para manter o serviço no ar, mas não garantimos funcionamento ininterrupto. Recomendamos exportar backups periódicos. Podemos alterar ou descontinuar recursos, avisando com antecedência razoável quando houver impacto para você.']],
        ['Encerramento', ['Você pode excluir sua conta a qualquer momento pelo app. Podemos suspender ou encerrar contas que violem estes termos. Se você tiver uma assinatura ativa, cancele-a também pelo portal de pagamento.']],
        ['Responsabilidade', ['Na medida permitida pela lei, nossa responsabilidade fica limitada ao valor que você pagou nos 12 meses anteriores ao fato. Isso não afasta direitos que a lei garante ao consumidor.']],
        ['Propriedade intelectual', ['O software, o nome e a marca Lumen Regnum pertencem à operadora. Estes termos não transferem a você nenhum direito sobre eles além do uso do serviço.']],
        ['Lei aplicável e foro', ['Estes termos seguem a lei brasileira. Para consumidores, fica eleito o foro do seu domicílio.']],
        ['Mudanças nos termos', ['Podemos atualizar estes termos. A data no topo mostra a última revisão; mudanças relevantes serão avisadas no app ou por e-mail.']],
      ],
    },
    contactTitle: 'Contato',
    contactText: (email) => `Dúvidas, pedidos sobre seus dados ou arrependimento: ${email}`,
    updated: 'Última atualização',
    backHome: 'Voltar ao início',
    navTerms: 'Termos de Uso',
    navPrivacy: 'Política de Privacidade',
  },
  en: {
    privacy: {
      slug: 'privacy',
      title: 'Privacy Policy',
      intro: 'This policy explains what data Lumen Regnum collects, what we use it for and what rights you have, in line with Brazil\'s General Data Protection Law (LGPD, Law 13,709/2018).',
      sections: [
        ['Who controls your data', [`Lumen Regnum is operated by ${op}, who decides how your personal data is processed.`]],
        ['Data we collect', [
          '• Account: email, password and language. The password is stored protected (hashed) by the authentication provider; we never see it.',
          '• Campaign content: everything you write or upload in the app (NPCs, locations, factions, secrets, sessions, notes, images and maps).',
          '• Subscription: Stripe customer and subscription identifiers and your plan. Card details are handled only by Stripe; we have no access to them.',
          '• Waiting list: email, language, the page you signed up on and, when present, the campaign parameters in the URL (UTM), which show which ad or link you came from.',
          '• Technical data: access logs generated by the hosting provider (such as IP address, date and time), used for security and to run the service.',
        ]],
        ['Cookies and browser storage', ['We do not use tracking cookies or advertising pixels. Your browser only keeps what the app needs to work: your login session, your chosen language and, during sign-up, the plan you picked.']],
        ['What we use it for and the legal basis', [
          '• Run your account, deliver the service and process your subscription (performance of a contract, art. 7, V).',
          '• Tell you when the service opens, if you joined the waiting list (consent, art. 7, I). You can withdraw consent at any time.',
          '• Keep the service secure, prevent abuse and understand which channels sign-ups come from (legitimate interest, art. 7, IX).',
          '• Meet tax and legal obligations (art. 7, II).',
          'We do not sell your data and we do not use your campaign content for advertising. If AI features ever process your content, we will tell you first and update this policy.',
        ]],
        ['Who we share it with', [
          'We use providers that process data on our behalf, only for what is necessary:',
          '• Supabase: authentication, database and file storage.',
          '• Vercel: hosting for the site and server functions.',
          '• Stripe: payment processing and subscription management.',
          'We may also disclose data if required by law or a court order.',
        ]],
        ['International transfers', ['Our providers store and process data outside Brazil, mainly in the United States (the database runs in the us-west-2 region, in Oregon). This is done with the providers above, which apply contractual and security safeguards, under art. 33 of the LGPD.']],
        ['How long we keep it', [
          '• Account and campaigns: while the account exists. When you delete your account in the app, your campaigns and your registration are erased.',
          '• Waiting list: until launch or until you ask to be removed.',
          '• Billing data: for the period required by tax and accounting law.',
        ]],
        ['Your rights', [
          'At any time you can ask for: confirmation that we process your data; access; correction; anonymization, blocking or deletion of unnecessary data; portability; information about who we share it with; and withdrawal of consent. You may also complain to Brazil\'s data protection authority (ANPD).',
          'Inside the app you can export your campaign to a file (a Starter plan feature) and delete your account.',
        ]],
        ['Security', ['Each account only sees its own data, connections use HTTPS and plan limits are enforced on the server. No system is completely secure, but we work to reduce risk and fix issues quickly.']],
        ['Children', ['The service is not aimed at children. If we learn a child created an account without a guardian, we may remove it.']],
        ['Changes to this policy', ['We may update this policy. The date at the top shows the last revision; relevant changes will be announced in the app or by email.']],
      ],
    },
    terms: {
      slug: 'terms',
      title: 'Terms of Use',
      intro: 'By creating an account or using Lumen Regnum you agree to these terms. They apply together with the Privacy Policy.',
      sections: [
        ['The service', [`Lumen Regnum is a tabletop RPG campaign manager for game masters, operated by ${op}. It lets you organize your world, characters, secrets, sessions, encounters and media.`]],
        ['Your account', ['You must be 18 or older, or use the service with a guardian\'s consent. Keep your password safe: you are responsible for what happens in your account. Tell us if you suspect misuse.']],
        ['Plans and payment', [
          '• The Explorer plan is free and has usage limits, described on the plans page and in the app.',
          '• The Starter plan is paid, billed monthly and recurring through Stripe. It renews automatically until cancelled.',
          '• You can cancel any time from the billing portal inside the app. Access continues until the end of the period you already paid.',
          '• The currency and final amount are shown at checkout. Price changes apply from the next cycle and are announced beforehand.',
        ]],
        ['Right of withdrawal', ['For purchases made online, you may withdraw within 7 calendar days of subscribing, with a full refund, under art. 49 of Brazil\'s Consumer Protection Code. Ask using the contact shown at the end of this page.']],
        ['Plan limits and cancelling', ['When you return to the free plan nothing is deleted: what you already created stays. You just cannot create new items above the plan limit.']],
        ['Your content', [
          'Your campaign content is yours. You only authorize us to store it and show it to you so the service works.',
          'You state that you have the rights to what you upload (such as images and maps) and must not upload unlawful content or content that infringes others\' rights.',
        ]],
        ['Acceptable use', ['Do not try to bypass limits or the service\'s security, access other accounts\' data, run mass automated scraping, or overload the infrastructure.']],
        ['Features in development', ['Features described as "coming soon" or "on the way" (such as AI, a co-GM and a read-only link for players) are in development. They are intentions with no guaranteed date and are not part of what you purchase today.']],
        ['Availability and changes', ['We work to keep the service running but do not guarantee uninterrupted operation. We recommend exporting backups regularly. We may change or discontinue features, giving reasonable notice when it affects you.']],
        ['Ending the relationship', ['You may delete your account at any time in the app. We may suspend or close accounts that break these terms. If you have an active subscription, cancel it in the billing portal as well.']],
        ['Liability', ['To the extent allowed by law, our liability is limited to the amount you paid in the 12 months before the event. This does not remove rights that the law grants to consumers.']],
        ['Intellectual property', ['The software and the Lumen Regnum name and brand belong to the operator. These terms do not give you any right to them beyond using the service.']],
        ['Governing law and venue', ['These terms are governed by Brazilian law. For consumers, the courts of your home city have jurisdiction.']],
        ['Changes to the terms', ['We may update these terms. The date at the top shows the last revision; relevant changes will be announced in the app or by email.']],
      ],
    },
    contactTitle: 'Contact',
    contactText: (email) => `Questions, requests about your data or withdrawal: ${email}`,
    updated: 'Last updated',
    backHome: 'Back to home',
    navTerms: 'Terms of Use',
    navPrivacy: 'Privacy Policy',
  },
};
