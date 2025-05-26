document.getElementById('projectForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const skills = document.getElementById('skills').value.split(',').map(skill => skill.trim());
  const image = document.getElementById('image').value.trim();
  const live = document.getElementById('live').value.trim();
  const github = document.getElementById('github').value.trim();

  const newProject = { title, description, skills, image, live, github };

  let projects = JSON.parse(localStorage.getItem('projects')) || [];
  projects.push(newProject);
  localStorage.setItem('projects', JSON.stringify(projects));

  document.getElementById('projectForm').reset();
  const successMessage = document.getElementById('successMessage');
  successMessage.classList.remove('hidden');
  setTimeout(() => {
    successMessage.classList.add('hidden');
  }, 3000);
});
