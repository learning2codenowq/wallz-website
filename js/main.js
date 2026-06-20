/* ═══════════════════════════════════════════════
   WALLZ — MAIN.JS
   ═══════════════════════════════════════════════ */

/* ── Hero Carousel ── */
(function () {
  var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
  var current = 0;
  var timer = null;

  if (slides.length === 0) return;

  function goTo(index) {
    slides[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
  }

  function next() {
    goTo(current + 1);
  }

  function startTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(next, 5000);
  }

  /* Make sure first slide is active on load */
  slides.forEach(function(s) { s.classList.remove('active'); });
  slides[0].classList.add('active');
  current = 0;

  startTimer();
})();

/* ── Project Application Form ── */
(function () {

  var answers = {};
  var currentStep = 1;
  var isDubai = false;

  var SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

  function getStepOrder() {
    isDubai = (answers['q5'] === 'Dubai');
    var steps = [1, 2, 3, 4, 5];
    if (isDubai) steps.push(6);
    steps.push(7, 8, 9, 10, 11, 12, 13);
    return steps;
  }

  function updateProgress() {
    var order = getStepOrder();
    var idx = order.indexOf(currentStep);
    var total = order.length;
    var pct = Math.round(idx / total * 100);
    var fill = document.getElementById('wf-fill');
    var label = document.getElementById('wf-prog-label');
    if (fill) fill.style.width = pct + '%';
    if (label) label.textContent = 'Step ' + (idx + 1) + ' of ' + total;
  }

  function openStep(step) {
    currentStep = step;
    document.querySelectorAll('.wf-step-body').forEach(function (b) {
      b.classList.remove('active');
    });
    var body = document.getElementById('body' + step);
    if (body) body.classList.add('active');
    var step6Row = document.getElementById('step6-row');
    if (step6Row) step6Row.style.display = isDubai ? '' : 'none';
    updateProgress();
  }

  function markDone(step) {
    var chk = document.getElementById('chk' + step);
    if (chk) chk.classList.add('done');
    var q = document.getElementById('q' + step + '-label');
    if (q) q.classList.add('answered');
    var prev = document.getElementById('q' + step + '-preview');
    if (prev) prev.textContent = getPreview(step);
  }

  function nextStep(fromStep) {
    markDone(fromStep);
    var order = getStepOrder();
    var idx = order.indexOf(fromStep);
    if (idx < order.length - 1) {
      var nextS = order[idx + 1];
      openStep(nextS);
      setTimeout(function () {
        var body = document.getElementById('body' + nextS);
        if (body) body.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 60);
    }
  }

  function getPreview(step) {
    var v = answers['q' + step];
    if (!v) return '';
    if (Array.isArray(v)) return v.slice(0, 2).join(', ') + (v.length > 2 ? '...' : '');
    return v;
  }

  function handleRadio(group, val, el) {
    answers[group] = val;
    document.querySelectorAll('[data-group="' + group + '"]').forEach(function (opt) {
      opt.classList.remove('selected');
      var r = opt.querySelector('.wf-radio');
      if (r) r.classList.remove('sel');
    });
    el.classList.add('selected');
    var r2 = el.querySelector('.wf-radio');
    if (r2) r2.classList.add('sel');

    var stepNum = group.replace('q', '').replace('-contact', '').replace('-source', '');
    var nextBtn = document.getElementById('next' + stepNum);
    if (nextBtn) nextBtn.disabled = false;

    if (group === 'q5') {
      isDubai = (val === 'Dubai');
      var step6Row = document.getElementById('step6-row');
      if (step6Row) step6Row.style.display = isDubai ? '' : 'none';
    }
    if (group === 'q13-contact' || group === 'q13-source') validateFinal();
  }

  function handleCheckbox(group, val, el, maxSel) {
    if (!answers[group]) answers[group] = [];
    var arr = answers[group];
    var idx = arr.indexOf(val);
    if (idx > -1) {
      arr.splice(idx, 1);
      el.classList.remove('selected');
      var cb = el.querySelector('.wf-checkbox');
      if (cb) cb.classList.remove('sel');
    } else {
      if (maxSel && arr.length >= maxSel) {
        var note = document.getElementById('q2-maxnote');
        if (note) note.textContent = 'Maximum ' + maxSel + ' selections reached.';
        return;
      }
      arr.push(val);
      el.classList.add('selected');
      var cb2 = el.querySelector('.wf-checkbox');
      if (cb2) cb2.classList.add('sel');
    }
    if (group === 'q2') {
      var note2 = document.getElementById('q2-maxnote');
      if (note2 && arr.length < (maxSel || 99)) note2.textContent = '';
    }
    var stepNum2 = group.replace('q', '');
    var nextBtn2 = document.getElementById('next' + stepNum2);
    if (nextBtn2) nextBtn2.disabled = arr.length === 0;
  }

  function onSelectChange(stepNum) {
    var sel = document.getElementById('q' + stepNum + '-select');
    if (!sel) return;
    answers['q' + stepNum] = sel.value;
    var nextBtn = document.getElementById('next' + stepNum);
    if (nextBtn) nextBtn.disabled = !sel.value;
  }

  function validateFinal() {
    var name = (document.getElementById('q13-name').value || '').trim();
    var phone = (document.getElementById('q13-phone').value || '').trim();
    var email = (document.getElementById('q13-email').value || '').trim();
    var contact = answers['q13-contact'];
    var source = answers['q13-source'];
    var btn = document.getElementById('btn-submit');
    if (btn) btn.disabled = !(name && phone && email && contact && source);
  }

  function submitForm() {
    var btn = document.getElementById('btn-submit');
    if (btn) { btn.disabled = true; btn.textContent = 'Submitting...'; }

    var data = new FormData();
    data.append('q1', answers['q1'] || '');
    data.append('q2', (answers['q2'] || []).join(', '));
    data.append('q3', answers['q3'] || '');
    data.append('q4', answers['q4'] || '');
    data.append('q5', answers['q5'] || '');
    data.append('q6', answers['q6'] || '');
    data.append('q7', (answers['q7'] || []).join(', '));
    data.append('q8', answers['q8'] || '');
    data.append('q9', answers['q9'] || '');
    data.append('q10', answers['q10'] || '');
    data.append('q11', answers['q11'] || '');
    data.append('q12', answers['q12'] || '');
    data.append('name', (document.getElementById('q13-name').value || '').trim());
    data.append('phone', (document.getElementById('q13-phone').value || '').trim());
    data.append('email', (document.getElementById('q13-email').value || '').trim());
    data.append('contact', answers['q13-contact'] || '');
    data.append('source', answers['q13-source'] || '');

    fetch(SCRIPT_URL, { method: 'POST', body: data })
      .then(function () {
        document.getElementById('wf-steps').style.display = 'none';
        document.getElementById('wf-fill').style.display = 'none';
        document.getElementById('wf-prog-label').style.display = 'none';
        document.getElementById('wf-success').style.display = 'block';
        var applySection = document.getElementById('apply');
        if (applySection) {
          applySection.classList.add('wf-success-state');
          applySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      })
      .catch(function () {
        if (btn) { btn.disabled = false; btn.textContent = 'Begin My Project Discovery'; }
        alert('Something went wrong. Please try again.');
      });
  }

  document.querySelectorAll('.wf-option').forEach(function (opt) {
    opt.addEventListener('click', function () {
      var group = opt.dataset.group;
      var val = opt.dataset.val;
      if (opt.querySelector('.wf-radio')) {
        handleRadio(group, val, opt);
      } else if (opt.querySelector('.wf-checkbox')) {
        var maxSel = (group === 'q2') ? 3 : null;
        handleCheckbox(group, val, opt, maxSel);
      }
    });
  });

  var textarea = document.getElementById('q12-text');
  if (textarea) {
    textarea.addEventListener('input', function () {
      answers['q12'] = textarea.value.trim();
      var btn = document.getElementById('next12');
      if (btn) btn.disabled = textarea.value.trim().length < 10;
    });
  }

  window.nextStep = nextStep;
  window.onSelectChange = onSelectChange;
  window.validateFinal = validateFinal;
  window.submitForm = submitForm;

  updateProgress();

})();