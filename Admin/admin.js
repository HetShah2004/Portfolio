const firebaseConfig = {
  apiKey: "AIzaSyCl4u_oL9dSCkMt92HcaPoJ_NMEWvonSwg",
  authDomain: "portfolio-444cb.firebaseapp.com",
  projectId: "portfolio-444cb",
  storageBucket: "portfolio-444cb.firebasestorage.app",
  messagingSenderId: "103683774011",
  appId: "1:103683774011:web:54c0465c8fe98b33866e1e"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// Admin Authentication
function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById('auth-container').classList.add('hidden');
      document.getElementById('project-form').classList.remove('hidden');
    })
    .catch(error => alert(error.message));
}

// Project Form Submission
document.getElementById('projectForm').addEventListener('submit', e => {
  e.preventDefault();
  
  const projectData = {
    title: document.getElementById('projectTitle').value,
    description: document.getElementById('projectDesc').value,
    image: document.getElementById('projectImage').value,
    skills: document.getElementById('projectSkills').value.split(',').map(s => s.trim()),
    github: document.getElementById('githubLink').value,
    live: document.getElementById('liveLink').value,
    timestamp: Date.now()
  };

  database.ref('projects').push(projectData)
    .then(() => {
      alert('Project added successfully!');
      document.getElementById('projectForm').reset();
    })
    .catch(error => alert(error.message));
});

// Auth State Listener
auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('project-form').classList.remove('hidden');
  }
});