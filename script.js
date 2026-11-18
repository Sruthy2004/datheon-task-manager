"use strict";

// HTML elements
const taskForm = document.getElementById("task-form");
const taskTitle = document.getElementById("task-title");
const taskCategory = document.getElementById("task-category");
const taskDate = document.getElementById("task-date");

const taskList = document.getElementById("task-list");
const submitButton = document.getElementById("submit-button");
const cancelButton = document.getElementById("cancel-button");
const formHeading = document.getElementById("form-heading");

const searchInput = document.getElementById("search-input");
const filterButtons = document.querySelectorAll(".filter-btn");

// Load saved tasks safely
function loadTasks() {
    try {
        const savedTasks = JSON.parse(
            localStorage.getItem("taskflow-tasks")
        );

        return Array.isArray(savedTasks) ? savedTasks : [];
    } catch (error) {
        console.error("Could not load saved tasks:", error);
        return [];
    }
}

let tasks = loadTasks();
let currentFilter = "all";
let editingTaskId = null;

// Today's date
document.getElementById("today-date").textContent =
    new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric"
    });

document.getElementById("year").textContent =
    new Date().getFullYear();

// Save tasks
function saveTasks() {
    try {
        localStorage.setItem("taskflow-tasks", JSON.stringify(tasks));
    } catch (error) {
        console.error("Could not save tasks:", error);
        alert("Unable to save tasks in this browser.");
    }
}

// Escape user-entered text before displaying it
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

// Format due date
function formatDate(dateString) {
    if (!dateString) return "No due date";

    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// Update dashboard numbers
function updateStatistics() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;

    const progress = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    document.getElementById("total-count").textContent = total;
    document.getElementById("pending-count").textContent = pending;
    document.getElementById("completed-count").textContent = completed;
    document.getElementById("progress-count").textContent = progress + "%";
}

// Render all visible tasks
function renderTasks() {
    const searchText = searchInput.value.trim().toLowerCase();

    const filteredTasks = tasks
        .filter(task => {
            const matchesSearch = task.title
                .toLowerCase()
                .includes(searchText);

            const matchesFilter =
                currentFilter === "all" ||
                (currentFilter === "pending" && !task.completed) ||
                (currentFilter === "completed" && task.completed);

            return matchesSearch && matchesFilter;
        })
        .sort((a, b) => b.id - a.id);

    taskList.innerHTML = "";

    document.getElementById("task-count-label").textContent =
        `${filteredTasks.length} task${filteredTasks.length === 1 ? "" : "s"}`;

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>No tasks found</h3>
                <p>Add a new task or change your search/filter.</p>
            </div>
        `;

        updateStatistics();
        return;
    }

    filteredTasks.forEach(task => {
        const card = document.createElement("article");

        card.className = task.completed
            ? "task-card completed"
            : "task-card";

        const categoryClass = task.category.toLowerCase();

        card.innerHTML = `
            <div class="task-main">

                <input
                    type="checkbox"
                    class="task-checkbox"
                    aria-label="Mark ${escapeHTML(task.title)} as complete"
                    ${task.completed ? "checked" : ""}
                >

                <div class="task-info">
                    <h3>${escapeHTML(task.title)}</h3>

                    <div class="task-meta">
                        <span class="tag ${categoryClass}">
                            ${escapeHTML(task.category)}
                        </span>

                        <span class="tag">
                            📅 ${formatDate(task.dueDate)}
                        </span>

                        <span class="tag ${task.completed ? "done" : "pending"}">
                            ${task.completed ? "Completed" : "Pending"}
                        </span>
                    </div>
                </div>

            </div>

            <div class="task-actions">
                <button type="button" class="action-btn edit-btn">
                    Edit
                </button>

                <button type="button" class="action-btn delete-btn">
                    Delete
                </button>
            </div>
        `;

        // Complete / uncomplete
        card.querySelector(".task-checkbox").addEventListener("change", () => {
            toggleTask(task.id);
        });

        // Edit
        card.querySelector(".edit-btn").addEventListener("click", () => {
            editTask(task.id);
        });

        // Delete
        card.querySelector(".delete-btn").addEventListener("click", () => {
            deleteTask(task.id);
        });

        taskList.appendChild(card);
    });

    updateStatistics();
}

// Add or update a task
taskForm.addEventListener("submit", event => {
    event.preventDefault();

    const title = taskTitle.value.trim();

    if (!title) {
        alert("Please enter a task name.");
        taskTitle.focus();
        return;
    }

    if (editingTaskId !== null) {
        const existingTask = tasks.find(
            task => task.id === editingTaskId
        );

        if (!existingTask) {
            resetForm();
            return;
        }

        existingTask.title = title;
        existingTask.category = taskCategory.value;
        existingTask.dueDate = taskDate.value;

    } else {
        const newTask = {
            id: Date.now(),
            title: title,
            category: taskCategory.value,
            dueDate: taskDate.value,
            completed: false
        };

        tasks.push(newTask);
    }

    saveTasks();
    resetForm();
    renderTasks();
});

// Edit a task
function editTask(id) {
    const task = tasks.find(item => item.id === id);

    if (!task) return;

    editingTaskId = id;

    taskTitle.value = task.title;
    taskCategory.value = task.category;
    taskDate.value = task.dueDate || "";

    formHeading.textContent = "Edit Task";
    submitButton.textContent = "Save Changes";
    cancelButton.hidden = false;

    document.getElementById("task-form-section").scrollIntoView({
        behavior: "smooth"
    });

    taskTitle.focus();
}

// Reset form
function resetForm() {
    taskForm.reset();

    editingTaskId = null;

    formHeading.textContent = "Add a New Task";
    submitButton.textContent = "+ Add Task";
    cancelButton.hidden = true;
}

// Cancel editing
cancelButton.addEventListener("click", resetForm);

// Mark a task complete or pending
function toggleTask(id) {
    const task = tasks.find(item => item.id === id);

    if (!task) return;

    task.completed = !task.completed;

    saveTasks();
    renderTasks();
}

// Delete a task
function deleteTask(id) {
    const task = tasks.find(item => item.id === id);

    if (!task) return;

    const confirmed = window.confirm(
        `Delete "${task.title}"?`
    );

    if (!confirmed) return;

    tasks = tasks.filter(item => item.id !== id);

    if (editingTaskId === id) {
        resetForm();
    }

    saveTasks();
    renderTasks();
}

// Filter buttons
filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;

        filterButtons.forEach(item => {
            item.classList.toggle("active", item === button);
        });

        renderTasks();
    });
});

// Search
searchInput.addEventListener("input", renderTasks);

// Initial display
renderTasks();