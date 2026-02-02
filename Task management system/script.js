// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
initApp();
} else {
document.addEventListener('firebase-ready', initApp);
}
});

let tasks = [];
let currentUser = null;
let tasksListener = null;
let confettiEnabled = true;
let soundEnabled = true;

// Add near the top of script.js
const CATEGORIES = ['Assignments', 'Projects', 'Exams', 'Homework', 'Research', 'Study Group', 'Personal', 'Other'];

function initApp() {
console.log('Initializing app...');

const taskTitle = document.getElementById('taskTitle');
const taskDesc = document.getElementById('taskDesc');
const taskDate = document.getElementById('taskDate');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const statusFilter = document.getElementById('statusFilter');
const totalTasks = document.getElementById('totalTasks');
const todoTasks = document.getElementById('todoTasks');
const progressTasks = document.getElementById('progressTasks');
const doneTasks = document.getElementById('doneTasks');
const userEmail = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');

const today = new Date().toISOString().split('T')[0];
if (taskDate) {
taskDate.value = today;
taskDate.min = today;
}

if (!addBtn || !taskList) {
console.error('Required DOM elements not found');
return;
}

addBtn.addEventListener('click', addTask);
if (statusFilter) statusFilter.addEventListener('change', renderTasks);
if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

if (window.auth) {
auth.onAuthStateChanged(async (user) => {
if (user) {
currentUser = user;
if (userEmail) userEmail.textContent = user.email;
setupRealTimeListener();
} else {
if (tasksListener) {
tasksListener();
}
window.location.href = 'login.html';
}
});
}
}

function setupRealTimeListener() {
if (!currentUser || !db) return;

if (tasksListener) {
tasksListener();
}

try {
console.log('Setting up real-time listener for user:', currentUser.uid);

tasksListener = db.collection('tasks')
.where('userId', '==', currentUser.uid)
.onSnapshot((querySnapshot) => {
console.log('Real-time update received');

tasks = [];
querySnapshot.forEach(doc => {
const data = doc.data();
tasks.push({
id: doc.id,
title: data.title || 'Untitled',
description: data.description || 'No description',
deadline: data.deadline || 'No deadline',
category: data.category || 'Other', // ADD THIS
priority: data.priority || 'medium', // ADD THIS
status: data.status || 'todo',
userId: data.userId,
createdAt: data.createdAt ? data.createdAt.toDate() : new Date()
});
});

tasks.sort((a, b) => b.createdAt - a.createdAt);

console.log('Tasks updated:', tasks.length);
renderTasks();
updateStats();
}, (error) => {
console.error('Error in real-time listener:', error);
loadTasksOnce();
});

} catch (error) {
console.error('Error setting up listener:', error);
loadTasksOnce();
}
}

async function loadTasksOnce() {
if (!currentUser || !db) return;

try {
const querySnapshot = await db.collection('tasks')
.where('userId', '==', currentUser.uid)
.get();

tasks = [];
querySnapshot.forEach(doc => {
const data = doc.data();
tasks.push({
id: doc.id,
title: data.title || 'Untitled',
description: data.description || 'No description',
deadline: data.deadline || 'No deadline',
category: data.category || 'Other', // ADD THIS
priority: data.priority || 'medium', // ADD THIS
status: data.status || 'todo',
userId: data.userId,
createdAt: data.createdAt ? data.createdAt.toDate() : new Date()
});
});

tasks.sort((a, b) => b.createdAt - a.createdAt);

console.log('Tasks loaded once:', tasks.length);
renderTasks();
updateStats();

} catch (error) {
console.error('Error loading tasks:', error);
}
}

async function addTask() {
if (!currentUser) {
alert('Please login first');
return;
}

const taskTitle = document.getElementById('taskTitle');
const taskDesc = document.getElementById('taskDesc');
const taskDate = document.getElementById('taskDate');
const taskCategory = document.getElementById('taskCategory'); // ADD THIS
const taskPriority = document.getElementById('taskPriority'); // ADD THIS

if (!taskTitle || !taskTitle.value.trim()) {
alert('Please enter a task title');
return;
}

const newTask = {
title: taskTitle.value.trim(),
description: taskDesc ? taskDesc.value.trim() : '',
deadline: taskDate && taskDate.value ? taskDate.value : 'No deadline',
category: taskCategory ? taskCategory.value : 'Other', // ADD THIS
priority: taskPriority ? taskPriority.value : 'medium', // ADD THIS
status: 'todo',
userId: currentUser.uid,
createdAt: firebase.firestore.FieldValue.serverTimestamp()
};

try {
const addBtn = document.getElementById('addBtn');
const originalText = addBtn.innerHTML;
addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
addBtn.disabled = true;

await db.collection('tasks').add(newTask);
console.log('Task saved to Firestore');

taskTitle.value = '';
if (taskDesc) taskDesc.value = '';
if (taskDate) taskDate.value = '';

showTaskAddedAnimation();

setTimeout(() => {
addBtn.innerHTML = originalText;
addBtn.disabled = false;
}, 500);

} catch (error) {
console.error('Error adding task:', error);
alert('Error adding task: ' + error.message);

const addBtn = document.getElementById('addBtn');
addBtn.innerHTML = '<i class="fas fa-plus"></i> Add Task';
addBtn.disabled = false;
}
}

async function deleteTask(id) {
if (!confirm('Are you sure you want to delete this task?')) return;

try {
await db.collection('tasks').doc(id).delete();
} catch (error) {
console.error('Error deleting task:', error);
alert('Error deleting task: ' + error.message);
}
}

async function editTask(id) {
const task = tasks.find(t => t.id === id);
if (!task) return;

// Create modal HTML
const modalHTML = `
<div class="modal-overlay" id="editModal">
<div class="modal">
<div class="modal-header">
<h2><i class="fas fa-edit"></i> Edit Task</h2>
<button class="close-modal" id="closeModal">
<i class="fas fa-times"></i>
</button>
</div>
<div class="modal-body">
<form id="editTaskForm">
<div class="modal-input-group">
<label for="editTitle"><i class="fas fa-heading"></i> Task Title</label>
<input type="text" id="editTitle" value="${escapeHtml(task.title)}" required>
</div>

<div class="modal-input-group">
<label for="editDescription"><i class="fas fa-align-left"></i> Description</label>
<textarea id="editDescription" required>${escapeHtml(task.description)}</textarea>
</div>

<div class="modal-input-group">
<label for="editCategory"><i class="fas fa-folder"></i> Category</label>
<select id="editCategory" required>
${CATEGORIES.map(cat =>
`<option value="${cat}" ${cat === task.category ? 'selected' : ''}>${cat}</option>`
).join('')}
</select>
</div>

<div class="modal-input-group">
<label for="editPriority"><i class="fas fa-flag"></i> Priority</label>
<select id="editPriority" required>
<option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
<option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
<option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
<option value="urgent" ${task.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
</select>
</div>

<div class="modal-input-group">
<label for="editDeadline"><i class="far fa-calendar-alt"></i> Due Date</label>
<input type="date" id="editDeadline" value="${task.deadline === 'No deadline' ? '' : task.deadline}">
</div>

<div class="modal-input-group">
<label><i class="fas fa-chart-line"></i> Current Status</label>
<div style="display: flex; gap: 15px; margin-top: 10px;">
<label style="display: flex; align-items: center; gap: 8px;">
<input type="radio" name="editStatus" value="todo" ${task.status === 'todo' ? 'checked' : ''}>
<span class="status-indicator status-todo"></span>
To Do
</label>
<label style="display: flex; align-items: center; gap: 8px;">
<input type="radio" name="editStatus" value="progress" ${task.status === 'progress' ? 'checked' : ''}>
<span class="status-indicator status-progress"></span>
In Progress
</label>
<label style="display: flex; align-items: center; gap: 8px;">
<input type="radio" name="editStatus" value="done" ${task.status === 'done' ? 'checked' : ''}>
<span class="status-indicator status-done"></span>
Done
</label>
</div>
</div>

<div class="modal-input-group">
<label><i class="far fa-clock"></i> Task Info</label>
<div style="background: #f8f9fa; padding: 15px; border-radius: 10px; font-size: 0.9rem;">
<div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
<span style="color: #666;">Created:</span>
<span style="font-weight: 500;">
${task.createdAt ? task.createdAt.toLocaleDateString('en-US', {
year: 'numeric',
month: 'short',
day: 'numeric',
hour: '2-digit',
minute: '2-digit'
}) : 'Unknown'}
</span>
</div>
<div style="display: flex; justify-content: space-between;">
<span style="color: #666;">Last Updated:</span>
<span style="font-weight: 500;">Just now</span>
</div>
</div>
</div>

<div class="modal-actions">
<button type="button" class="btn-cancel" id="cancelEdit">
<i class="fas fa-times"></i> Cancel
</button>
<button type="submit" class="btn-save">
<i class="fas fa-save"></i> Save Changes
</button>
</div>
</form>
</div>
</div>
</div>
`;

// Add modal to page
document.body.insertAdjacentHTML('beforeend', modalHTML);

// Get modal elements
const modal = document.getElementById('editModal');
const closeBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelEdit');
const form = document.getElementById('editTaskForm');

// Set min date for deadline to today
const deadlineInput = document.getElementById('editDeadline');
if (deadlineInput) {
const today = new Date().toISOString().split('T')[0];
deadlineInput.min = today;
}

// Show modal
setTimeout(() => modal.classList.add('active'), 10);

// Close modal functions
const closeModal = () => {
modal.classList.remove('active');
setTimeout(() => modal.remove(), 300);
};

closeBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);

// Close on outside click
modal.addEventListener('click', (e) => {
if (e.target === modal) {
closeModal();
}
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
if (e.key === 'Escape' && modal.classList.contains('active')) {
closeModal();
}
});

// Handle form submission
form.addEventListener('submit', async (e) => {
e.preventDefault();

const newTitle = document.getElementById('editTitle').value.trim();
const newDesc = document.getElementById('editDescription').value.trim();
const newCategory = document.getElementById('editCategory').value;
const newPriority = document.getElementById('editPriority').value;
const newDeadline = document.getElementById('editDeadline').value;
const newStatus = document.querySelector('input[name="editStatus"]:checked').value;

// Validate
if (!newTitle) {
alert('Please enter a task title');
return;
}

const updates = {
title: newTitle,
description: newDesc,
category: newCategory,
priority: newPriority,
deadline: newDeadline || 'No deadline',
status: newStatus,
updatedAt: firebase.firestore.FieldValue.serverTimestamp()
};

