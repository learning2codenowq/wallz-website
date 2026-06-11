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

/* ── Lead Capture Form ── */
(function () {
  var form = document.getElementById('apply-form');
  var status = document.getElementById('form-status');

  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var name = form.name.value.trim();
    var email = form.email.value.trim();
    var phone = form.phone.value.trim();
    var enquiry = form.enquiry.value;

    if (!name || !email || !phone || !enquiry) {
      status.textContent = 'Please fill in all fields.';
      status.style.color = 'rgba(0,0,0,0.5)';
      return;
    }

    var submitBtn = form.querySelector('.form-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    status.textContent = '';

    var SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

    var data = new FormData();
    data.append('name', name);
    data.append('email', email);
    data.append('phone', phone);
    data.append('enquiry', enquiry);

    fetch(SCRIPT_URL, { method: 'POST', body: data })
      .then(function (res) { return res.text(); })
      .then(function () {
        status.textContent = 'Application received. We will be in touch.';
        status.style.color = 'rgba(0,0,0,0.6)';
        submitBtn.textContent = 'Submitted';
        form.reset();
      })
      .catch(function () {
        status.textContent = 'Something went wrong. Please try again.';
        status.style.color = 'rgba(0,0,0,0.5)';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Application';
      });
  });
})();