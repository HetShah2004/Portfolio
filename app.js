document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger-menu');
  const navItems = document.querySelector('.nav-items');
  const wrapper = document.getElementById('wrapper');

  // --- Hamburger Menu Logic ---
  hamburger.addEventListener('click', () => {
    console.log("Hamburger clicked");
    navItems.classList.toggle('active');
  });

  // --- Custom Smooth Scroll Function ---
  function smoothScrollTo(targetPosition, duration) {
    const startPosition = wrapper.scrollTop;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function animation(currentTime) {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = ease(timeElapsed, startPosition, distance, duration);
      wrapper.scrollTop = run;
      if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    // Easing function for a more natural scroll
    function ease(t, b, c, d) {
      t /= d / 2;
      if (t < 1) return c / 2 * t * t + b;
      t--;
      return -c / 2 * (t * (t - 2) - 1) + b;
    }

    requestAnimationFrame(animation);
  }


  // --- Event Listeners for Navigation Links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();

      if (navItems.classList.contains('active')) {
        navItems.classList.remove('active');
      }

      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        const targetPosition = targetElement.offsetTop;
        const scrollDuration = 2000; // <--- CHANGE DURATION HERE (in milliseconds)
        smoothScrollTo(targetPosition, scrollDuration);
      }
    });
  });

  // --- Contact Form Logic (Google Sheets) ---
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      
      const submitBtn = document.getElementById('submit-btn');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Sending... <i class="fa-solid fa-spinner fa-spin"></i>';
      submitBtn.disabled = true;

      // REPLACE THIS URL WITH YOUR GOOGLE APPS SCRIPT WEB APP URL
      const scriptURL = 'https://script.google.com/macros/s/AKfycbzsg_j4en9A7b4F2Sqrcx6v748cJWIqjqwJyeDps0p_t1o_qWOa4wsLPeh2mAkRJSjs/exec'; 

      const formData = new FormData(contactForm);

      // Honeypot Check
      if (formData.get('honeypot')) {
          console.log("Bot detected!");
          submitBtn.innerHTML = originalBtnText;
          submitBtn.disabled = false;
          alert('Message sent successfully!'); // Fake success
          contactForm.reset();
          return;
      }

      fetch(scriptURL, { method: 'POST', body: formData })
        .then(response => {
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
            alert('Message sent successfully!');
            contactForm.reset();
        })
        .catch(error => {
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
            alert('Error sending message. Please try again.');
            console.error('Error!', error.message);
        });
    });
  }
});