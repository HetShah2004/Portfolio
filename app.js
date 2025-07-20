// const contactForm = document.querySelector('form');
// contactForm.addEventListener('submit', async (e) => {
//   e.preventDefault();

//   const data = {
//     name: contactForm.name.value,
//     email: contactForm.email.value,
//     subject: contactForm.subject.value,
//     message: contactForm.message.value
//   };

//   try {
//     const response = await fetch('http://localhost:5000/api/contact', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(data)
//     });

//     const result = await response.json();
//     alert(result.message);
//     contactForm.reset();
//   } catch (err) {
//     alert('Error sending message. Try again.');
//     console.error(err);
//   }
// });

// document.addEventListener('DOMContentLoaded', () => {
//   const hamburger = document.querySelector('.hamburger-menu');
//   const navItems = document.querySelector('.nav-items');

//   hamburger.addEventListener('click', () => {
//     navItems.classList.toggle('active');
//   });

//   document.querySelectorAll('.nav-items a').forEach(link => {
//     link.addEventListener('click', () => {
//       navItems.classList.remove('active');
//     });
//   });
// });

document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger-menu');
  const navItems = document.querySelector('.nav-items');
  const wrapper = document.getElementById('wrapper');

  // --- Hamburger Menu Logic ---
  hamburger.addEventListener('click', () => {
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

  // --- Existing Contact Form Logic ---
  const contactForm = document.querySelector('form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const data = {
        name: contactForm.name.value,
        email: contactForm.email.value,
        subject: contactForm.subject.value,
        message: contactForm.message.value
      };

      try {
        const response = await fetch('http://localhost:5000/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const result = await response.json();
        alert(result.message);
        contactForm.reset();
      } catch (err) {
        alert('Error sending message. Try again.');
        console.error(err);
      }
    });
  }
});