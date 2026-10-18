// Lista de espera: envia o e-mail para /api/waitlist (sem bibliotecas, compatível com a CSP do site).
(function () {
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
