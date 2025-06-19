document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const categorySelect = document.getElementById('category-select');
    const dueDateInput = document.getElementById('due-date');
    const prioritySelect = document.getElementById('priority-select');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const sortSelect = document.getElementById('sort-select');
    const themeSwitcher = document.getElementById('theme-switcher');
    
    // Initialize tasks array
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    
    // Initialize theme
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    themeSwitcher.checked = currentTheme === 'dark';
    
    // Render tasks
    renderTasks();
    
    // Event Listeners
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTask();
    });
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => filterTasks(button.dataset.filter));
    });
    
    sortSelect.addEventListener('change', () => {
        sortTasks();
        renderTasks();
    });
    
    themeSwitcher.addEventListener('change', toggleTheme);
    
    // Functions
    function addTask() {
        const title = taskInput.value.trim();
        if (!title) return;
        
        const newTask = {
            id: Date.now(),
            title,
            category: categorySelect.value,
            dueDate: dueDateInput.value,
            priority: prioritySelect.value,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        tasks.push(newTask);
        saveTasks();
        renderTasks();
        
        // Reset input
        taskInput.value = '';
        dueDateInput.value = '';
        categorySelect.value = 'general';
        prioritySelect.value = 'low';
        taskInput.focus();
    }
    
    function renderTasks(filter = 'all') {
        taskList.innerHTML = '';
        
        if (tasks.length === 0) {
            taskList.innerHTML = '<p class="empty-message">No tasks found. Add a task to get started!</p>';
            return;
        }
        
        const filteredTasks = filter === 'all' 
            ? tasks 
            : tasks.filter(task => task.category === filter);
        
        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.priority} ${task.completed ? 'completed' : ''}`;
            taskItem.dataset.id = task.id;
            
            const dueDate = task.dueDate 
                ? new Date(task.dueDate).toLocaleDateString() 
                : 'No due date';
                
            const priorityText = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
            
            taskItem.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-details">
                        <span class="task-category">${task.category}</span>
                        <span class="task-due"><i class="far fa-calendar-alt"></i> ${dueDate}</span>
                        <span class="task-priority"><i class="fas fa-exclamation-circle"></i> ${priorityText}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="edit-btn" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" title="Delete"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            
            taskList.appendChild(taskItem);
        });
        
        // Add event listeners to checkboxes and buttons
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', toggleTaskComplete);
        });
        
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', editTask);
        });
        
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', deleteTask);
        });
    }
    
    function toggleTaskComplete(e) {
        const taskId = parseInt(e.target.closest('.task-item').dataset.id);
        const task = tasks.find(task => task.id === taskId);
        task.completed = e.target.checked;
        saveTasks();
        renderTasks();
    }
    
    function editTask(e) {
        const taskItem = e.target.closest('.task-item');
        const taskId = parseInt(taskItem.dataset.id);
        const task = tasks.find(task => task.id === taskId);
        
        // Replace content with editable inputs
        taskItem.innerHTML = `
            <input type="text" class="edit-task-input" value="${task.title}">
            <select class="edit-category-select">
                <option value="general" ${task.category === 'general' ? 'selected' : ''}>General</option>
                <option value="work" ${task.category === 'work' ? 'selected' : ''}>Work</option>
                <option value="personal" ${task.category === 'personal' ? 'selected' : ''}>Personal</option>
                <option value="shopping" ${task.category === 'shopping' ? 'selected' : ''}>Shopping</option>
            </select>
            <input type="date" class="edit-due-date" value="${task.dueDate || ''}">
            <select class="edit-priority-select">
                <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
                <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
            </select>
            <div class="edit-actions">
                <button class="save-btn"><i class="fas fa-save"></i> Save</button>
                <button class="cancel-btn"><i class="fas fa-times"></i> Cancel</button>
            </div>
        `;
        
        // Focus on the input
        taskItem.querySelector('.edit-task-input').focus();
        
        // Add event listeners
        taskItem.querySelector('.save-btn').addEventListener('click', () => saveEditedTask(taskId));
        taskItem.querySelector('.cancel-btn').addEventListener('click', renderTasks);
    }
    
    function saveEditedTask(taskId) {
        const taskItem = document.querySelector(`.task-item[data-id="${taskId}"]`);
        const task = tasks.find(task => task.id === taskId);
        
        task.title = taskItem.querySelector('.edit-task-input').value.trim();
        task.category = taskItem.querySelector('.edit-category-select').value;
        task.dueDate = taskItem.querySelector('.edit-due-date').value;
        task.priority = taskItem.querySelector('.edit-priority-select').value;
        
        saveTasks();
        renderTasks();
    }
    
    function deleteTask(e) {
        const taskId = parseInt(e.target.closest('.task-item').dataset.id);
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
    }
    
    function filterTasks(filter) {
        // Update active filter button
        filterButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.filter === filter);
        });
        
        renderTasks(filter);
    }
    
    function sortTasks() {
        const sortBy = sortSelect.value;
        
        switch(sortBy) {
            case 'added':
                tasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'due':
                tasks.sort((a, b) => {
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });
                break;
            case 'priority':
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                tasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
                break;
        }
        
        saveTasks();
    }
    
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    function toggleTheme() {
        const newTheme = themeSwitcher.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }
});