document.addEventListener('DOMContentLoaded', () => {
  // --- 1. Typed.js Initialization ---
  if (document.querySelector('.role')) {
    new Typed(".role", {
      strings: [
        "Backend Engineer",
        "Python Developer",
        "ML Enthusiast",
        "System Architect"
      ],
      loop: true,
      typeSpeed: 50,
      backSpeed: 30,
      backDelay: 1500,
    });
  }

  // --- 2. Mobile Menu Toggle ---
  const mobileMenuBtn = document.getElementById('mobile-menu');
  const navLinks = document.getElementById('nav-links');
  
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const icon = mobileMenuBtn.querySelector('i');
      if (navLinks.classList.contains('active')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-xmark');
      } else {
        icon.classList.remove('fa-xmark');
        icon.classList.add('fa-bars');
      }
    });

    // Close menu when a link is clicked
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const icon = mobileMenuBtn.querySelector('i');
        if (icon) {
          icon.classList.remove('fa-xmark');
          icon.classList.add('fa-bars');
        }
      });
    });
  }

  // --- 3. Scroll Reveal Animation ---
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (!prefersReducedMotion) {
    const revealElements = document.querySelectorAll('.reveal');
    
    const revealOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    };
    
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, revealOptions);
    
    revealElements.forEach(el => {
      revealObserver.observe(el);
    });
  } else {
    document.querySelectorAll('.reveal').forEach(el => {
      el.classList.add('active');
      el.style.transition = 'none';
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.filter = 'none';
    });
  }

  // --- 4. Scroll Spy (Active Nav Link) ---
  const sections = document.querySelectorAll('section');
  const navItems = document.querySelectorAll('.nav-link');
  
  window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (pageYOffset >= (sectionTop - 150)) {
        current = section.getAttribute('id');
      }
    });
    
    navItems.forEach(li => {
      li.classList.remove('active');
      if (li.getAttribute('href').includes(current) && current !== '') {
        li.classList.add('active');
      }
    });
  });

  // --- 5. Contact Form Submission (Google Apps Script) ---
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      
      const submitBtn = document.getElementById('submit-btn');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Sending... <i class="fa-solid fa-spinner fa-spin"></i>';
      submitBtn.disabled = true;

      // Ensure the URL matches the one the user previously set up
      const scriptURL = 'https://script.google.com/macros/s/AKfycbzsg_j4en9A7b4F2Sqrcx6v748cJWIqjqwJyeDps0p_t1o_qWOa4wsLPeh2mAkRJSjs/exec'; 

      const formData = new FormData(contactForm);

      // Honeypot Check (anti-spam)
      if (formData.get('honeypot')) {
          console.log("Bot detected!");
          submitBtn.innerHTML = originalBtnText;
          submitBtn.disabled = false;
          alert('Message sent successfully!'); // Fake success for bots
          contactForm.reset();
          return;
      }

      fetch(scriptURL, { method: 'POST', body: formData })
        .then(response => {
            submitBtn.innerHTML = 'Sent <i class="fa-solid fa-check"></i>';
            submitBtn.style.backgroundColor = 'var(--success)';
            
            setTimeout(() => {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.style.backgroundColor = '';
                submitBtn.disabled = false;
            }, 3000);
            
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