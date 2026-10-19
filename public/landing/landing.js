// Lista de espera: envia o e-mail para /api/waitlist (sem bibliotecas, compatível com a CSP do site).
(function () {
  // UTM: guarda a origem do primeiro acesso (anúncio/link) enquanto a aba estiver aberta e envia junto com o e-mail.
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  function readUtm() {
    var found = {};
    try {
      var q = new URLSearchParams(location.search);
      UTM_KEYS.forEach(function (k) { var v = q.get(k); if (v) found[k] = v.slice(0, 100); });
    } catch (e) { /* navegador antigo: sem UTM */ }
    try {
      if (Object.keys(found).length) sessionStorage.setItem('lumen_utm', JSON.stringify(found));
      else { var saved = sessionStorage.getItem('lumen_utm'); if (saved) found = JSON.parse(saved) || {}; }
    } catch (e) { /* armazenamento bloqueado: usa só o que está na URL */ }
    return found;
  }
  var utm = readUtm();

  var forms = document.querySelectorAll('[data-wait-form]');
  forms.forEach(function (form) {
    var msg = form.querySelector('.wait-msg');
    var btn = form.querySelector('button[type=submit]');
    var email = form.querySelector('input[name=email]');
    function show(text, kind) { msg.textContent = text; msg.className = 'wait-msg ' + (kind || ''); }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!email.checkValidity()) { show(form.dataset.err, 'err'); email.focus(); return; }
      var original = btn.textContent;
      btn.disabled = true; btn.textContent = form.dataset.sending; show('');
      fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.value,
          lang: form.dataset.lang,
          source: form.dataset.source,
          utm: utm,
          website: (form.querySelector('input[name=website]') || {}).value || ''
        })
      }).then(function (res) {
        if (res.ok) { show(form.dataset.ok, 'ok'); email.value = ''; }
        else if (res.status === 429) show(form.dataset.rate, 'err');
        else show(form.dataset.err, 'err');
      }).catch(function () { show(form.dataset.err, 'err'); })
        .then(function () { btn.disabled = false; btn.textContent = original; });
    });
  });
})();
