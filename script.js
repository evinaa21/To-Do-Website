const taskInput = document.getElementById('task-input');
const todosList = document.getElementById('todos-list');
const addTaskBtn = document.getElementById('add-task-btn');
const filterButtons = document.querySelectorAll('[data-filter]');
const themeSwitcher = document.getElementById('theme-switcher');
const soundToggle = document.getElementById('sound-toggle');
const petalsBackground = document.querySelector('.petals-background');
const celebration = document.getElementById('celebration'); // Cat celebration element

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let isSoundOn = true;
const backgroundMusic = new Audio('fl.mp3');

function init() {
  loadTasks();
  addTaskBtn.addEventListener('click', addTask);
  themeSwitcher.addEventListener('click', switchTheme);
  filterButtons.forEach(button => button.addEventListener('click', () => filterTodos(button.getAttribute('data-filter'))));
  taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
  });
  createFallingPetals();
  playSound();
}

document.addEventListener('DOMContentLoaded', init);

function createFallingPetals() {
  for (let i = 0; i < 20; i++) {
    const petal = document.createElement('div');
    petal.classList.add('petal');
    petal.style.left = `${Math.random() * 100}%`;
    petal.style.animationDuration = `${Math.random() * 2 + 3}s`;
    petalsBackground.appendChild(petal);
  }
}

function addTask() {
  if (taskInput.value.trim() === "") return;
  const task = {
    id: Date.now(),
    name: taskInput.value.trim(),
    completed: false
  };
  tasks.push(task);
  saveTasks();
  renderTasks();
  taskInput.value = "";
}

function renderTask(task) {
  const taskItem = document.createElement('li');
  taskItem.setAttribute('data-id', task.id);
  taskItem.classList.add('task-item');
  if (task.completed) {
    taskItem.classList.add('completed');
    taskItem.style.textDecoration = 'line-through';
  }
  taskItem.innerHTML = `<span>${task.name}</span> <div> <button class="complete-btn">✓</button> <button class="delete-btn">🗑</button> </div>`;
  taskItem.querySelector('.complete-btn').addEventListener('click', () => toggleTaskStatus(task.id));
  taskItem.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));
  todosList.appendChild(taskItem);
}

function toggleTaskStatus(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
      if (task.completed) {
        celebrate(); // Trigger celebration only when task is completed
      }
    }
  }
  
  function celebrate() {
    const celebration = document.getElementById('celebration');
    celebration.classList.add('show'); // Show the cat celebration
  
    setTimeout(() => {
      celebration.classList.remove('show'); // Hide the cat after 3 seconds
    }, 3000); // Celebration lasts for 3 seconds
  }
  

function deleteTask(taskId) {
  tasks = tasks.filter(task => task.id !== taskId);
  saveTasks();
  renderTasks();
}

function filterTodos(status) {
  const filteredTasks = (status === 'all') ? tasks : tasks.filter(task => task.completed === (status === 'completed'));
  renderTasks(filteredTasks);
}

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks(filteredTasks = tasks) {
  todosList.innerHTML = '';
  filteredTasks.forEach(renderTask);
}

function loadTasks() {
  renderTasks();
}

function switchTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    themeSwitcher.textContent = newTheme === 'dark' ? '🌙' : '☀️';
  
    // Update task colors
    const tasks = document.querySelectorAll('.task-item');
    tasks.forEach(task => {
      task.classList.toggle('dark-theme', newTheme === 'dark');
    });
  
    renderTasks(); // Re-render tasks to apply the new theme
  }
  

soundToggle.addEventListener('click', () => {
  isSoundOn = !isSoundOn;
  soundToggle.textContent = isSoundOn ? '🔊' : '🔇';
  playSound(); // Toggle sound on or off when the button is clicked
});

function playSound() {
  backgroundMusic.loop = true;
  if (isSoundOn) {
    backgroundMusic.play().catch(() => {
      document.addEventListener('click', () => {
        backgroundMusic.play();
      }, { once: true });
    });
  } else {
    backgroundMusic.pause();
  }
}

// Trigger cat animation when a task is completed
function celebrate() {
  celebration.style.opacity = '1'; // Make the celebration div visible
  celebration.style.bottom = '0'; // Move the cat up to its final position
  setTimeout(() => {
    celebration.style.opacity = '0'; // Hide the celebration after 2 seconds
    celebration.style.bottom = '-150px'; // Move it back down
  }, 4000); // Keep the celebration visible for 4 seconds
}
