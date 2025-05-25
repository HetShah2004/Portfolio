const contactForm = document.querySelector('form');
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
