// router.js

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

fetch('../data/tutorials.json')
  .then(response => response.json())
  .then(data => {
    const tutorials = data.tutorials;
    const tutorialId = parseInt(getQueryParam('id'));
    const moduleId = parseInt(getQueryParam('module'));

    if (window.location.pathname.includes('tutorial.html')) {
      const tutorial = tutorials.find(t => t.id === tutorialId);
      if (tutorial) {
        document.getElementById('tutorial-title').textContent = tutorial.title;
        document.getElementById('tutorial-description').textContent = tutorial.description;
        const moduleContainer = document.getElementById('modules-list');
        tutorial.modules.forEach(module => {
          const link = document.createElement('a');
          link.href = `module.html?tutorial=${tutorial.id}&module=${module.id}`;
          link.textContent = module.title;
          link.style.display = 'block';
          moduleContainer.appendChild(link);
        });
      }
    }

    if (window.location.pathname.includes('module.html')) {
      const tutorial = tutorials.find(t => t.id === tutorialId);
      const module = tutorial?.modules.find(m => m.id === moduleId);
      if (module) {
        document.getElementById('module-title').textContent = module.title;
        const lessonList = document.getElementById('lessons-list');
        module.lessons.forEach(lesson => {
          const li = document.createElement('li');
          li.textContent = lesson;
          lessonList.appendChild(li);
        });
      }
    }
  });
