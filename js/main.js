/* ═══════════════════════════════════════════════
   WALLZ — MAIN.JS
   ═══════════════════════════════════════════════ */

/* ── Hero Carousel ── */
(function () {
  const slides = document.querySelectorAll('.hero-slide');
  const dots   = document.querySelectorAll('.hero-dot');
  let current  = 0;
  let timer    = null;

  function goTo(index) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = index;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  function next() {
    goTo((current + 1) % slides.length);
  }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(next, 5000);
  }

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      goTo(i);
      startTimer();
    });
  });

  startTimer();
})();

/* ── Lead Capture Form ── */
(function () {
  const form   = document.getElementById('apply-form');
  const status = document.getElementById('form-status');

  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const name    = form.name.value.trim();
    const email   = form.email.value.trim();
    const phone   = form.phone.value.trim();
    const enquiry = form.enquiry.value;

    if (!name || !email || !phone || !enquiry) {
      status.textContent = 'Please fill in all fields.';
      status.style.color = 'rgba(0,0,0,0.5)';
      return;
    }

    const submitBtn = form.querySelector('.form-submit');
    submitBtn.disabled  = true;
    submitBtn.textContent = 'Submitting...';
    status.textContent  = '';

    const SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

    const data = new FormData();
    data.append('name', name);
    data.append('email', email);
    data.append('phone', phone);
    data.append('enquiry', enquiry);

    fetch(SCRIPT_URL, { method: 'POST', body: data })
      .then(function (res) { return res.text(); })
      .then(function () {
        status.textContent    = 'Application received. We will be in touch.';
        status.style.color    = 'rgba(0,0,0,0.6)';
        submitBtn.textContent = 'Submitted';
        form.reset();
      })
      .catch(function () {
        status.textContent    = 'Something went wrong. Please try again.';
        status.style.color    = 'rgba(0,0,0,0.5)';
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Submit Application';
      });
  });
})();