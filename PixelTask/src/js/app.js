// Main JavaScript logic for the PixelTask application
document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const taskForm = document.getElementById('taskForm');
  const taskInput = document.getElementById('taskInput');
  const categoryInput = document.getElementById('categoryInput');
  const dueDateInput = document.getElementById('dueDateInput');
  const taskBoard = document.getElementById('taskBoard');
  const progressBar = document.getElementById('progressBar');
  const progressPercentage = document.getElementById('progressPercentage'); // Add this line
  const themeToggle = document.getElementById('themeToggle'); // Keep for reference or remove if button is gone
  const themeDropdownMenu = document.getElementById('themeDropdownMenu'); // Get dropdown menu
  const themeDropdownToggle = document.getElementById('themeDropdownToggle'); // Get dropdown toggle button
  const searchInput = document.getElementById('searchInput');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const noTasksMessage = document.getElementById('noTasksMessage');
  const toastContainer = document.querySelector('.toast-container');

  // --- State ---
  let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  let currentFilter = 'all';
  let searchTerm = '';
  const categories = ["Personal", "Work", "Study", "Other"];
  // Update themes array to include new ones
  const themes = ['sakura', 'ocean', 'forest', 'dark-forest', 'sunset-glow', 'minimal-mono']; // Define available themes

  // --- Functions ---

  // Generate Unique ID
  const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

  // Save tasks to LocalStorage with Error Handling
  const saveTasks = () => {
    try {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (e) {
        console.error("Error saving tasks to localStorage:", e);
        // Optionally show a user-facing error message
        showToast("Error saving tasks. Storage might be full.", "danger");
    }
  };

  // Show Toast Notification
  const showToast = (message, type = 'success') => {
    const toastId = 'toast-' + generateId();
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-bg-${type} border-0 animate__animated animate__fadeInRight" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 }); // 3 seconds delay
    toast.show();
    // Remove the toast element from DOM after it's hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
    // Add fadeOut animation on close button click
    const closeButton = toastElement.querySelector('.btn-close');
    closeButton.addEventListener('click', () => {
        toastElement.classList.remove('animate__fadeInRight');
        toastElement.classList.add('animate__fadeOutRight');
    });
  };


  // Format Due Date (optional, for better display)
  const formatDueDate = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        // Example format: "Oct 26, 5:00 PM" or "Oct 26" if time is midnight
        const optionsDate = { month: 'short', day: 'numeric' };
        const optionsTime = { hour: 'numeric', minute: 'numeric', hour12: true };
        const datePart = date.toLocaleDateString(undefined, optionsDate);
        if (date.getHours() === 0 && date.getMinutes() === 0) {
            return datePart;
        }
        const timePart = date.toLocaleTimeString(undefined, optionsTime);
        return `${datePart}, ${timePart}`;
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return dateString; // Fallback to original string
    }
  };

  // Render Tasks (Single List Layout)
  const renderTasks = () => {
    console.log('[renderTasks] Starting render (Single List).');
    taskBoard.innerHTML = ''; // Clear previous content

    // Filter tasks based on currentFilter and searchTerm
    let filteredTasks = tasks.filter(task => {
        // --- VALIDATION STEP within filter ---
        if (!task || typeof task !== 'object' || !task.id || !task.text || !task.category) {
            console.warn('[renderTasks] Filtering out invalid item found in tasks array:', task);
            return false; // Exclude invalid items from filtered list
        }
        // --- END VALIDATION ---
        const matchesFilter = currentFilter === 'all' || task.category === currentFilter;
        const matchesSearch = !searchTerm || task.text.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    // Check if there are tasks to display AFTER filtering
    if (filteredTasks.length === 0 && tasks.length > 0) {
        taskBoard.innerHTML = '<p class="text-center text-muted mt-4 col-12">No tasks match the current filter/search. ✨</p>';
        noTasksMessage.style.display = 'none';
        updateProgressBar();
        updateStats();
        console.log('[renderTasks] Render finished: No matching tasks.');
        return;
    } else if (tasks.length === 0) {
        noTasksMessage.style.display = 'block';
        taskBoard.innerHTML = '';
        updateProgressBar();
        updateStats();
        console.log('[renderTasks] Render finished: No tasks at all.');
        return;
    } else {
        noTasksMessage.style.display = 'none';
    }

    // --- Sort the filtered tasks directly ---
    // Example: Pinned first, then incomplete, then by due date
    filteredTasks.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        if (a.completed !== b.completed) return a.completed ? 1 : -1; // Assuming 'completed' property exists
        const dateA = a.dueDate ? new Date(a.dueDate) : null;
        const dateB = b.dueDate ? new Date(b.dueDate) : null;
        if (dateA && dateB) return dateA - dateB;
        if (dateA) return -1;
        if (dateB) return 1;
        // Optional: Sort by creation date as a fallback
        const createdA = a.createdAt ? new Date(a.createdAt) : null;
        const createdB = b.createdAt ? new Date(b.createdAt) : null;
        if (createdA && createdB) return createdA - createdB; // Older first
        return 0;
    });

    // --- Render Task Cards Directly to Task Board ---
    console.log('[renderTasks] Rendering task cards directly...');
    filteredTasks.forEach((task, index) => {
        // Use the existing helper function to create the card element (ensure it returns <li> or <div>)
        const taskCard = createTaskCardElement(task, index);
        if (taskCard) {
            // Append the card directly to the taskBoard
            taskBoard.appendChild(taskCard);
        } else {
            console.error(`[renderTasks] Failed to create task card for task ID: ${task.id}`);
        }
    });

    // --- REMOVED SortableJS Initialization ---

    updateProgressBar();
    updateStats();
    console.log('[renderTasks] Render finished successfully (Single List).');
  };

  // --- Helper Function to Create Task Card Element ---
  // Ensure this returns a single element (e.g., <div> or <li>) that can be appended
  const createTaskCardElement = (task, index) => {
      try {
          // Use a <div> instead of <li> if taskBoard is not a <ul>
          const taskCard = document.createElement('div');
          // Adjust classes - remove list-group-item if not using list-group
          // Add column classes if you want cards side-by-side (e.g., 'col-md-6 col-lg-4 mb-3')
          // Or keep it simple for a vertical list:
          taskCard.className = `task-card glass animate__animated animate__fadeInUp animate__faster ${task.completed ? 'completed' : ''} ${task.pinned ? 'pinned' : ''} mb-3`; // Added mb-3 for spacing
          taskCard.dataset.id = task.id;

          // Add priority class if applicable
          if (task.priority) {
              taskCard.classList.add(`priority-${task.priority}`);
          }

          // Check for overdue status
          const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();
          if (isOverdue) {
              taskCard.classList.add('overdue');
          }

          // --- Card Content (Keep existing structure) ---
          const cardBody = document.createElement('div');
          cardBody.className = 'task-card-body d-flex flex-column';

          const taskText = document.createElement('p');
          taskText.className = 'task-text-card mb-1 fw-bold';
          taskText.textContent = task.text;
          cardBody.appendChild(taskText);

          const taskDetails = document.createElement('div');
          taskDetails.className = 'task-details-card d-flex align-items-center gap-2 mb-2';

          const taskCategory = document.createElement('span');
          taskCategory.className = 'badge rounded-pill me-auto';
          const categoryColors = { Personal: 'bg-primary', Work: 'bg-info', Study: 'bg-warning', Other: 'bg-secondary' };
          taskCategory.classList.add(categoryColors[task.category] || 'bg-secondary', 'text-dark');
          taskCategory.textContent = task.category;
          taskDetails.appendChild(taskCategory);

          if (task.dueDate) {
              const taskDueDate = document.createElement('span');
              taskDueDate.className = 'task-due-date-card small text-muted';
              taskDueDate.innerHTML = `<i class="fa-regular fa-clock me-1"></i>${formatDueDate(task.dueDate)}`;
              taskDetails.appendChild(taskDueDate);
          }
          cardBody.appendChild(taskDetails);

          const taskActions = document.createElement('div');
          taskActions.className = 'task-actions-card d-flex justify-content-end gap-1';

          const createActionButton = (iconClass, title, actionClass) => {
              const btn = document.createElement('button');
              btn.className = `btn btn-sm btn-icon ${actionClass}`;
              btn.title = title;
              btn.innerHTML = `<i class="fas ${iconClass} fa-fw"></i>`;
              return btn;
          };

          taskActions.appendChild(createActionButton('fa-thumbtack', task.pinned ? 'Unpin' : 'Pin', 'action-pin'));
          taskActions.appendChild(createActionButton(task.completed ? 'fa-times-circle' : 'fa-check-circle', task.completed ? 'Mark Incomplete' : 'Mark Complete', 'action-toggle'));
          taskActions.appendChild(createActionButton('fa-pencil-alt', 'Edit Task', 'action-edit'));
          taskActions.appendChild(createActionButton('fa-trash-alt', 'Delete Task', 'action-delete'));

          cardBody.appendChild(taskActions);
          // --- End Card Content ---

          taskCard.appendChild(cardBody);
          return taskCard; // Return the fully constructed card <div>

      } catch (error) {
          console.error(`Error creating task card for task ID ${task?.id}:`, error);
          return null;
      }
  };

  // --- REMOVE or COMMENT OUT the handleDrop function ---
  /*
  const handleDrop = (evt) => {
      // ... (code related to column changes is no longer relevant) ...
      // If you want reordering within the single list, this needs different logic
      // based on evt.newIndex and evt.oldIndex, potentially updating an 'order' property.
      console.log("Drag and drop finished, but column logic is removed.");
      // Maybe just save and re-render to reflect potential order changes if SortableJS is added back later
      // saveTasks();
      // renderTasks();
  };
  */

  // --- Update Progress Bar ---
  const updateProgressBar = () => {
    const totalTasks = tasks.length;
    const completedTasksCount = tasks.filter(task => task.completed).length;
    const progress = totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 0;
    progressBar.style.width = `${progress}%`;
    progressBar.setAttribute('aria-valuenow', progress.toFixed(0));
    progressPercentage.textContent = `${progress.toFixed(0)}%`; // Update the text
  };

  // --- Update Stats --- (Add this function if you don't have it)
  const updateStats = () => {
      const totalTasksCount = tasks.length;
      const completedTasksCount = tasks.filter(task => task.completed).length;
      const productivity = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;

      document.getElementById('totalTasks').textContent = totalTasksCount;
      document.getElementById('completedTasks').textContent = completedTasksCount;
      document.getElementById('productivityScore').textContent = `${productivity.toFixed(0)}%`;
  };

  // --- Add Task ---
  // Ensure the 'completed' property is used if you renamed 'done'
  const addTask = (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    const category = categoryInput.value;
    const dueDate = dueDateInput.value;

    if (!text) {
      showToast('Task description cannot be empty!', 'warning');
      taskInput.focus();
      return;
    }

    const newTask = {
      id: generateId(),
      text: text,
      category: category,
      dueDate: dueDate,
      completed: false, // Use 'completed' if that's your property name
      pinned: false,
      createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks(); // Re-render the single list
    showToast(`Task "${newTask.text.substring(0, 20)}..." added!`, 'success');
    taskInput.value = '';
    dueDateInput.value = '';
    taskInput.focus();
  };

  // --- Handle Task Actions ---
  // Ensure checks use 'completed' if you renamed 'done'
  const handleTaskAction = (e) => {
    const targetButton = e.target.closest('button.btn-icon');
    if (!targetButton) return;
    const taskCard = targetButton.closest('.task-card');
    if (!taskCard) return;
    const taskId = taskCard.dataset.id;
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    let actionRequiresRender = false;

    if (targetButton.classList.contains('action-toggle')) {
      tasks[taskIndex].completed = !tasks[taskIndex].completed; // Use 'completed'
      // Toggle classes directly on the card
      taskCard.classList.toggle('completed', tasks[taskIndex].completed); // Use 'completed'
      // Update overdue status based on 'completed'
      taskCard.classList.toggle('overdue', tasks[taskIndex].dueDate && !tasks[taskIndex].completed && new Date(tasks[taskIndex].dueDate) < new Date());
      updateProgressBar(); // Update progress bar on completion toggle
      showToast(`Task ${tasks[taskIndex].completed ? 'completed' : 'marked incomplete'}.`, 'info');
      saveTasks(); // Save the change
      // No full re-render needed for toggle unless sorting changes drastically
    }
    else if (targetButton.classList.contains('action-delete')) {
      if (confirm(`Are you sure you want to delete the task "${tasks[taskIndex].text}"?`)) {
        const deletedText = tasks[taskIndex].text;
        // Animate out before removing
        taskCard.classList.remove('animate__fadeInUp');
        taskCard.classList.add('animate__animated', 'animate__fadeOutLeft');
        taskCard.addEventListener('animationend', () => {
          tasks.splice(taskIndex, 1);
          saveTasks();
          renderTasks(); // Re-render the list after removal
          showToast(`Task "${deletedText.substring(0, 20)}..." deleted.`, 'warning');
        }, { once: true });
        return; // Prevent further processing
      } else {
        return;
      }
    }
    else if (targetButton.classList.contains('action-edit')) {
      editTask(taskCard, taskIndex);
      return; // Edit handles its own rendering/saving
    }
    else if (targetButton.classList.contains('action-pin')) {
      tasks[taskIndex].pinned = !tasks[taskIndex].pinned;
      actionRequiresRender = true; // Pinning affects sort order
      showToast(`Task ${tasks[taskIndex].pinned ? 'pinned' : 'unpinned'}.`, 'info');
    }

    if (actionRequiresRender) {
        saveTasks();
        renderTasks(); // Re-render if sorting might change (like pinning)
    }
  };


  // --- Edit Task ---
  // Ensure it uses 'completed' if needed, though edit form doesn't usually change completion status directly
  const editTask = (taskCard, taskIndex) => {
      const task = tasks[taskIndex];
      const taskTextDiv = taskCard.querySelector('.task-text-card');
      const taskDetailsDiv = taskCard.querySelector('.task-details-card');
      const taskActionsDiv = taskCard.querySelector('.task-actions-card');

      if (taskTextDiv) taskTextDiv.style.display = 'none';
      if (taskDetailsDiv) taskDetailsDiv.style.display = 'none';
      if (taskActionsDiv) taskActionsDiv.style.display = 'none';

      const editForm = document.createElement('form');
      editForm.className = 'edit-form';
      const currentDueDate = task.dueDate ? task.dueDate.slice(0, 16) : '';

      editForm.innerHTML = `
          <div class="edit-input-group mb-2">
              <input type="text" class="form-control form-control-sm edit-text" value="${task.text}" required aria-label="Edit task description">
              <select class="form-select form-select-sm edit-category" aria-label="Edit task category">
                  ${categories.map(cat => `<option value="${cat}" ${task.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
              </select>
              <input type="datetime-local" class="form-control form-control-sm edit-due-date" value="${currentDueDate}" aria-label="Edit task due date">
          </div>
          <div class="edit-actions">
              <button type="submit" class="btn btn-success btn-sm" title="Save Changes"><i class="fa-solid fa-save"></i></button>
              <button type="button" class="btn btn-secondary btn-sm cancel-edit" title="Cancel Edit"><i class="fa-solid fa-times"></i></button>
          </div>
      `;

      taskCard.insertBefore(editForm, taskCard.firstChild);
      const editInput = editForm.querySelector('.edit-text');
      editInput.focus();
      editInput.select();

      editForm.onsubmit = (e) => {
          e.preventDefault();
          const newText = editForm.querySelector('.edit-text').value.trim();
          const newCategory = editForm.querySelector('.edit-category').value;
          const newDueDate = editForm.querySelector('.edit-due-date').value;

          if (newText) {
              tasks[taskIndex].text = newText;
              tasks[taskIndex].category = newCategory;
              tasks[taskIndex].dueDate = newDueDate;
              saveTasks();
              renderTasks(); // Re-render the list
              showToast(`Task updated.`, 'success');
          } else {
              showToast(`Task description cannot be empty.`, 'danger');
              editInput.focus();
          }
      };

      editForm.querySelector('.cancel-edit').onclick = () => {
          editForm.remove();
          if (taskTextDiv) taskTextDiv.style.display = '';
          if (taskDetailsDiv) taskDetailsDiv.style.display = '';
          if (taskActionsDiv) taskActionsDiv.style.display = '';
      };
  };


  // Handle Search Input
  const handleSearch = (e) => {
    // Debounce input slightly to avoid excessive rendering on fast typing (optional but good practice)
    clearTimeout(handleSearch.timer);
    handleSearch.timer = setTimeout(() => {
        searchTerm = e.target.value.trim();
        renderTasks();
    }, 250); // 250ms delay
  };

  // Handle Filter Button Clicks
  const handleFilter = (e) => {
    if (!e.target.classList.contains('filter-btn')) return;

    filterBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = e.target.dataset.filter;
    renderTasks();
  };

  // Apply Theme Function (Separated Logic)
  const applyTheme = (themeName) => {
    if (!themes.includes(themeName)) {
        console.warn(`Theme "${themeName}" not recognized. Defaulting to ${themes[0]}.`);
        themeName = themes[0];
    }
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('theme', themeName);
    // Optional: Update dropdown toggle icon/text if needed, but palette icon is generic
    // themeDropdownToggle.innerHTML = `<i class="fa-solid fa-adjust"></i> ${themeName}`; // Example
    console.log(`Theme changed to: ${themeName}`);

    // Update active state in dropdown
    themeDropdownMenu.querySelectorAll('.dropdown-item').forEach(item => {
        item.classList.toggle('active', item.dataset.themeValue === themeName);
    });
  };


  // Handle Theme Selection from Dropdown
  const handleThemeSelection = (e) => {
      const themeButton = e.target.closest('[data-theme-value]');
      if (themeButton) {
          const selectedTheme = themeButton.dataset.themeValue;
          applyTheme(selectedTheme);
      }
  };

  // REMOVE or COMMENT OUT the old toggleTheme function
  /*
  const toggleTheme = () => {
    // ... old cycling logic ...
  };
  */

  // ... (keep other functions like initSortable, renderTasks, etc.) ...

  // --- Event Listeners ---
  taskForm.addEventListener('submit', addTask);
  taskBoard.addEventListener('click', handleTaskAction);
  searchInput.addEventListener('input', handleSearch);
  document.querySelector('.btn-group[aria-label="Filter by category"]').addEventListener('click', handleFilter);
  // themeToggle.addEventListener('click', toggleTheme); // REMOVE or COMMENT OUT this line
  themeDropdownMenu.addEventListener('click', handleThemeSelection); // Add listener for dropdown

  // --- Initial Setup ---
  // Get theme from localStorage or default to the first theme in the array
  let initialTheme = localStorage.getItem('theme');
  // Validate stored theme, default if invalid or not found
  if (!initialTheme || !themes.includes(initialTheme)) {
      initialTheme = themes[0]; // Default to 'sakura'
  }
  applyTheme(initialTheme); // Apply the initial theme using the new function

  renderTasks(); // Initial render
  updateStats(); // Also update stats on initial load
  updateProgressBar(); // Also update progress bar on initial load

}); // End DOMContentLoaded

document.addEventListener('keydown', (e) => {
    // Quick Add Task (Ctrl + Space)
    if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        document.getElementById('taskInput').focus();
    }
    // Quick Search (Ctrl + K)
    if (e.ctrlKey && e.code === 'KeyK') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
});