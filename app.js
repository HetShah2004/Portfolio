// Load Projects from Local Storage
function loadProjects() {
    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    const container = document.querySelector('.project-container');
    
    container.innerHTML = projects.map((project, index) => `
        <div class="project-card" id="project${index + 1}">
            <div class="project-number ${index % 2 === 0 ? 'project-number-right' : 'project-number-left'}">
                ${String(index + 1).padStart(2, '0')}
            </div>
            <div class="project-content ${index % 2 === 0 ? 'project-content-left' : 'project-content-right'}">
                <div class="project-skills-container">
                    ${project.skills.map(skill => `
                        <img class="project-skill" src="./stack/${skill}.png" alt="${skill}">
                    `).join('')}
                </div>
                <h2 class="project-heading">${project.title}</h2>
                <p class="project-subHeading">${project.description}</p>
                <div class="btn-grp">
                    ${project.live ? `
                        <a href="${project.live}" target="_blank">
                            <button class="btn-pink btn-project">Show Live</button>
                        </a>` : ''}
                    ${project.github ? `
                        <a href="${project.github}" target="_blank">
                            <i class="fa-brands fa-github icon"></i>
                        </a>` : ''}
                </div>
            </div>
        </div>
    `).join('');

    // Set background images
    projects.forEach((project, index) => {
        const projectElement = document.getElementById(`project${index + 1}`);
        if (projectElement) {
            projectElement.style.backgroundImage = `url(${project.image})`;
        }
    });
}

<<<<<<< Updated upstream
// Initialize when page loads
document.addEventListener('DOMContentLoaded', loadProjects);
=======
    const result = await response.json();
    alert(result.message);
    contactForm.reset();
  } catch (err) {
    alert('Error sending message. Try again.');
    console.error(err);
  }
});

// Update your hamburger click event
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navItems.classList.toggle('active');
    document.querySelector('.backdrop')?.classList.toggle('active');
});

<<<<<<< Updated upstream
// Add click event to backdrop
document.querySelector('.backdrop')?.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navItems.classList.remove('active');
    document.querySelector('.backdrop').classList.remove('active');
});
>>>>>>> Stashed changes
=======
//       try {
//         const response = await fetch('http://localhost:5000/api/contact', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(data)
//         });

//         const result = await response.json();
//         alert(result.message);
//         contactForm.reset();
//       } catch (err) {
//         alert('Error sending message. Try again.');
//     console.error(err);
//       }
//     });
//   }
// --- Contact Form Logic for Google Sheets ---
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');
  
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      // Don't prevent default; let native form POST occur to hidden iframe
      
      // Show loading message
      formStatus.innerHTML = '<p class="sending">Sending message...</p>';
      
      // Get form values
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const subject = document.getElementById('subject').value;
      const message = document.getElementById('message').value;
      
      // Ensure the form posts to GAS (attributes also set in HTML)
      contactForm.method = 'POST';
      contactForm.target = 'hidden_iframe';
      // action is set in HTML. If needed, you can also set it here dynamically.

      // Provide optimistic UI feedback; the actual write happens server-side
      setTimeout(() => {
        formStatus.innerHTML = '<p class="success">Message sent! Check your Google Sheet.</p>';
        contactForm.reset();
        setTimeout(() => {
          formStatus.innerHTML = '';
        }, 3000);
      }, 1000);
    });
  }
});
>>>>>>> Stashed changes
