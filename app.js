// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCl4u_oL9dSCkMt92HcaPoJ_NMEWvonSwg",
  authDomain: "portfolio-444cb.firebaseapp.com",
  projectId: "portfolio-444cb",
  storageBucket: "portfolio-444cb.firebasestorage.app",
  messagingSenderId: "103683774011",
  appId: "1:103683774011:web:54c0465c8fe98b33866e1e"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Contact form submission
const contactForm = document.querySelector('form');
contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const name = contactForm.name.value;
  const email = contactForm.email.value;
  const subject = contactForm.subject.value;
  const message = contactForm.message.value;
  
  // Save to Firebase
  database.ref('contacts').push({
    name,
    email,
    subject,
    message,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  })
  .then(() => {
    alert('Message sent successfully!');
    contactForm.reset();
  })
  .catch((error) => {
    console.error('Error saving message:', error);
    alert('Error sending message. Please try again.');
  });
});