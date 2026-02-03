Add at top: // T2-07: Kanban board JavaScript by @Magic-Maggie - Sprint 2.
document.addEventListener('DOMContentLoaded', function() {
if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
initBoard();
} else {
document.addEventListener('firebase-ready', initBoard);
}
});

let tasks = [];
let currentUser = null;
let tasksListener = null;
let currentCategory = 'all';
let confettiEnabled = true;
let soundEnabled = true;

// Make sure categories match EXACTLY what's in your HTML form
const CATEGORIES = ['Assignments', 'Projects', 'Exams', 'Homework', 'Research', 'Study Group', 'Personal', 'Other'];

function initBoard() {
console.log('Initializing board...');

const userEmail = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');

if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

if (window.auth) {
auth.onAuthStateChanged(async (user) => {
if (user) {
currentUser = user;
if (userEmail) userEmail.textContent = user.email;
loadCategories();
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
tasksListener = db.collection('tasks')
.where('userId', '==', currentUser.uid)
.onSnapshot((querySnapshot) => {
tasks = [];
querySnapshot.forEach(doc => {
const data = doc.data();
tasks.push({
id: doc.id,
title: data.title || 'Untitled',
description: data.description || 'No description',
deadline: data.deadline || 'No deadline',
category: data.category || 'Other',
priority: data.priority || 'medium',
status: data.status || 'todo',
userId: data.userId,
createdAt: data.createdAt ? data.createdAt.toDate() : new Date()
});
});

console.log('Tasks loaded:', tasks.length);
console.log('Categories in tasks:', [...new Set(tasks.map(t => t.category))]);

renderBoard();
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
category: data.category || 'Other',
priority: data.priority || 'medium',
status: data.status || 'todo',
userId: data.userId,
createdAt: data.createdAt ? data.createdAt.toDate() : new Date()
});
});

console.log('Tasks loaded once:', tasks.length);
renderBoard();

} catch (error) {
console.error('Error loading tasks:', error);
}
}

function loadCategories() {
const categoryButtons = document.getElementById('categoryButtons');

// Clear and create fresh buttons
categoryButtons.innerHTML = `
<button class="category-btn active" data-category="all">
<i class="fas fa-layer-group"></i> All Categories
<span class="category-count">(0)</span>
</button>
${CATEGORIES.map(category => `
<button class="category-btn" data-category="${category}">
<i class="fas fa-folder"></i> ${category}
<span class="category-count">(0)</span>
</button>
`).join('')}
`;

// Event delegation - ONE event listener for all buttons
categoryButtons.addEventListener('click', function(e) {
const button = e.target.closest('.category-btn');
if (button) {
const category = button.dataset.category;
console.log('Category button clicked:', category);
switchCategory(category);
}
});
}

function updateCategoryCounts() {
if (!tasks || tasks.length === 0) {
// Set all counts to 0
document.querySelectorAll('.category-count').forEach(span => {
span.textContent = '(0)';
});
return;
}

// Update "All" category
const allBtn = document.querySelector('.category-btn[data-category="all"] .category-count');
if (allBtn) {
allBtn.textContent = `(${tasks.length})`;
}

// Update each category
CATEGORIES.forEach(category => {
const countSpan = document.querySelector(`.category-btn[data-category="${category}"] .category-count`);
if (countSpan) {
const count = tasks.filter(task => task.category === category).length;
countSpan.textContent = `(${count})`;
}
});
}

function switchCategory(category) {
console.log('Switching category from', currentCategory, 'to', category);
currentCategory = category;

// Update active button
document.querySelectorAll('.category-btn').forEach(btn => {
btn.classList.remove('active');
if (btn.dataset.category === category) {
btn.classList.add('active');
}
});

renderBoard();
}

function renderBoard() {
console.log('Rendering board for category:', currentCategory);
console.log('Total tasks available:', tasks.length);

const boardContainer = document.getElementById('boardContainer');
if (!boardContainer) return;

// Update category counts
updateCategoryCounts();

// Filter tasks by current category
let filteredTasks = tasks;
if (currentCategory !== 'all') {
filteredTasks = tasks.filter(task => {
console.log('Checking task:', task.category, 'vs', currentCategory, 'match:', task.category === currentCategory);
return task.category === currentCategory;
});
}

console.log('Filtered tasks count:', filteredTasks.length);

const todoTasks = filteredTasks.filter(t => t.status === 'todo');
const progressTasks = filteredTasks.filter(t => t.status === 'progress');
const doneTasks = filteredTasks.filter(t => t.status === 'done');

boardContainer.innerHTML = `
<div class="kanban-board">
<!-- To Do Column -->
<div class="status-column" id="todoColumn">
<div class="column-header">
<h3><i class="fas fa-clock" style="color: #ef4444;"></i> To Do</h3>
<span class="task-count">${todoTasks.length}</span>
</div>
<div class="tasks-list" id="todoList">
${renderTaskCards(todoTasks, 'todo')}
</div>
</div>

<!-- In Progress Column -->
<div class="status-column" id="progressColumn">
<div class="column-header">
<h3><i class="fas fa-spinner" style="color: #f59e0b;"></i> In Progress</h3>
<span class="task-count">${progressTasks.length}</span>
</div>
<div class="tasks-list" id="progressList">
${renderTaskCards(progressTasks, 'progress')}
</div>
</div>

<!-- Done Column -->
<div class="status-column" id="doneColumn">
<div class="column-header">
<h3><i class="fas fa-check-circle" style="color: #10b981;"></i> Done</h3>
<span class="task-count">${doneTasks.length}</span>
</div>
<div class="tasks-list" id="doneList">
${renderTaskCards(doneTasks, 'done')}
</div>
</div>
</div>
`;

// Add event listeners to task action buttons
setTimeout(() => {
document.querySelectorAll('.status-btn').forEach(btn => {
btn.addEventListener('click', function() {
const taskId = this.closest('.task-card').dataset.id;
changeStatus(taskId);
});
});

document.querySelectorAll('.edit-btn').forEach(btn => {
btn.addEventListener('click', function() {
const taskId = this.closest('.task-card').dataset.id;
editTask(taskId);
});
});

document.querySelectorAll('.delete-btn').forEach(btn => {
btn.addEventListener('click', function() {
const taskId = this.closest('.task-card').dataset.id;
deleteTask(taskId);
});
});

// Make tasks draggable
makeTasksDraggable();
}, 100);
}

function renderTaskCards(taskList, columnStatus) {
if (taskList.length === 0) {
return `
<div class="empty-column">
<i class="fas fa-tasks"></i>
<p>No tasks in ${columnStatus === 'todo' ? 'To Do' : columnStatus === 'progress' ? 'In Progress' : 'Done'}</p>
<small>Category: ${currentCategory === 'all' ? 'All categories' : currentCategory}</small>
</div>
`;
}

return taskList.map(task => {
// Format created date
let formattedDate = 'No date';
if (task.createdAt && task.createdAt instanceof Date) {
formattedDate = task.createdAt.toLocaleDateString('en-US', {
year: 'numeric',
month: 'short',
day: 'numeric'
});
}

return `
<div class="task-card ${columnStatus}" data-id="${task.id}" draggable="true">
<div class="task-card-header">
<h4>${escapeHtml(task.title)}</h4>
<div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
<span class="task-category" style="background: rgba(102, 126, 234, 0.1); color: #667eea; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 500;">
<i class="fas fa-folder"></i> ${escapeHtml(task.category || 'Other')}
</span>
<span class="task-priority" style="background: ${getPriorityColor(task.priority)}; color: white; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 500;">
<i class="fas fa-flag"></i> ${escapeHtml(task.priority || 'medium').toUpperCase()}
</span>
</div>
</div>

<p style="margin: 10px 0; font-size: 0.9rem; color: #555;">${escapeHtml(task.description || 'No description')}</p>

<div class="task-card-footer">
<div style="display: flex; flex-direction: column; gap: 5px; font-size: 0.8rem;">
<small style="display: flex; align-items: center; gap: 5px; color: #666;">
<i class="far fa-calendar-alt"></i>
Due: ${escapeHtml(task.deadline || 'No deadline')}
</small>
<small style="display: flex; align-items: center; gap: 5px; color: #888;">
<i class="far fa-calendar-plus"></i>
Created: ${formattedDate}
</small>
<small style="display: flex; align-items: center; gap: 5px; color: #888;">
<i class="fas fa-chart-line"></i>
Status: <strong>${(task.status || 'todo').toUpperCase()}</strong>
</small>
</div>
<div class="task-actions">
${columnStatus !== 'done' ? `
<button class="status-btn" title="Change Status">
<i class="fas fa-arrow-right"></i>
</button>
` : ''}
<button class="edit-btn" title="Edit">
<i class="fas fa-edit"></i>
</button>
<button class="delete-btn" title="Delete">
<i class="fas fa-trash"></i>
</button>
</div>
</div>
</div>
`;
}).join('');
}

function getPriorityColor(priority) {
if (!priority) return '#f59e0b';

const colors = {
'low': '#10b981',
'medium': '#f59e0b',
'high': '#ef4444',
'urgent': '#dc2626'
};

return colors[priority.toLowerCase()] || '#f59e0b';
}

// ========== EMOJI CONFETTI ==========
function showSimpleConfetti() {
const emojis = ['🎉', '🎊', '✅', '✨', '🌟', '💫', '🥳', '🎈'];
const container = document.createElement('div');
container.style.position = 'fixed';
container.style.top = '0';
container.style.left = '0';
container.style.width = '100%';
container.style.height = '100%';
container.style.pointerEvents = 'none';
container.style.zIndex = '9999';
document.body.appendChild(container);

for (let i = 0; i < 30; i++) {
const confetti = document.createElement('div');
confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
confetti.style.position = 'absolute';
confetti.style.fontSize = '24px';
confetti.style.left = Math.random() * 100 + 'vw';
confetti.style.top = '-30px';
container.appendChild(confetti);

const duration = Math.random() * 2000 + 1000;
const delay = Math.random() * 500;

confetti.animate([
{ transform: 'translateY(0) rotate(0deg)', opacity: 1 },
{ transform: `translateY(${window.innerHeight}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
], {
duration: duration,
delay: delay,
easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)'
});

setTimeout(() => {
if (confetti.parentNode) {
confetti.remove();
}
}, duration + delay + 100);
}

setTimeout(() => {
if (container.parentNode) {
container.remove();
}
}, 3000);
}

// ========== SOUND FUNCTIONS ==========
function playCompletionSound() {
try {
const AudioContext = window.AudioContext || window.webkitAudioContext;
if (!AudioContext) {
console.log('AudioContext not supported');
return;
}

const audioContext = new AudioContext();
const oscillator = audioContext.createOscillator();
const gainNode = audioContext.createGain();

oscillator.connect(gainNode);
gainNode.connect(audioContext.destination);

const now = audioContext.currentTime;

oscillator.frequency.setValueAtTime(523.25, now);     // C5
oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
oscillator.frequency.setValueAtTime(783.99, now + 0.2); // G5

gainNode.gain.setValueAtTime(0.2, now);
gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

oscillator.start(now);
oscillator.stop(now + 0.5);

} catch (error) {
console.log('Sound playback error:', error);
playSimpleBeep();
}
}

function playSimpleBeep() {
try {
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const oscillator = audioContext.createOscillator();

oscillator.connect(audioContext.destination);
oscillator.frequency.value = 800;
oscillator.type = 'sine';

oscillator.start();
setTimeout(() => oscillator.stop(), 200);

} catch (error) {
console.log('All sound methods failed');
}
}

// ========== NOTIFICATION FUNCTIONS ==========
function showTaskCompletedMessage(taskTitle) {
const message = document.createElement('div');
message.style.position = 'fixed';
message.style.top = '20px';
message.style.right = '20px';
message.style.backgroundColor = '#10b981';
message.style.color = 'white';
message.style.padding = '15px 25px';
message.style.borderRadius = '10px';
message.style.zIndex = '10000';
message.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
message.style.fontWeight = '500';
message.style.display = 'flex';
message.style.alignItems = 'center';
message.style.gap = '10px';
message.innerHTML = `
<i class="fas fa-check-circle" style="font-size: 1.2rem;"></i>
<div>
<div style="font-weight: 600;">Task Completed!</div>
<div style="font-size: 0.9rem; opacity: 0.9;">${escapeHtml(taskTitle)}</div>
</div>
`;

document.body.appendChild(message);

message.animate([
{ transform: 'translateX(100%)', opacity: 0 },
{ transform: 'translateX(0)', opacity: 1 }
], {
duration: 500,
easing: 'ease-out'
});

setTimeout(() => {
message.animate([
{ transform: 'translateX(0)', opacity: 1 },
{ transform: 'translateX(100%)', opacity: 0 }
], {
duration: 500,
easing: 'ease-in'
}).onfinish = () => {
if (message.parentNode) {
message.remove();
}
};
}, 3000);
}
async function changeStatus(id) {
const task = tasks.find(t => t.id === id);
if (!task) return;

let newStatus;
let oldStatus = task.status;

if (task.status === 'todo') newStatus = 'progress';
else if (task.status === 'progress') newStatus = 'done';
else newStatus = 'todo';

try {
await db.collection('tasks').doc(id).update({
status: newStatus
});

// ADD THIS: Trigger sound and confetti when task is marked as done
if (confettiEnabled && newStatus === 'done' && oldStatus !== 'done') {
showSimpleConfetti();
showTaskCompletedMessage(task.title);

if (soundEnabled) {
playCompletionSound();
}
}

} catch (error) {
console.error('Error updating task status:', error);
alert('Error updating task status: ' + error.message);
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

try {
// Show loading state
const saveBtn = form.querySelector('.btn-save');
const originalText = saveBtn.innerHTML;
saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
saveBtn.disabled = true;

await db.collection('tasks').doc(id).update(updates);

// Show success animation
saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
saveBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

setTimeout(() => {
closeModal();
}, 1000);

} catch (error) {
console.error('Error updating task:', error);
alert('Error updating task: ' + error.message);

// Reset button
const saveBtn = form.querySelector('.btn-save');
saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
saveBtn.disabled = false;
}
});
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

function makeTasksDraggable() {
const taskCards = document.querySelectorAll('.task-card');
const columns = document.querySelectorAll('.tasks-list');

taskCards.forEach(card => {
card.addEventListener('dragstart', handleDragStart);
card.addEventListener('dragend', handleDragEnd);
});

columns.forEach(column => {
column.addEventListener('dragover', handleDragOver);
column.addEventListener('drop', handleDrop);
});
}

let draggedTask = null;

function handleDragStart(e) {
draggedTask = this;
this.classList.add('dragging');
e.dataTransfer.setData('text/plain', this.dataset.id);
}

function handleDragEnd() {
this.classList.remove('dragging');
draggedTask = null;
}

function handleDragOver(e) {
e.preventDefault();
this.classList.add('drag-over');
}

function handleDrop(e) {
e.preventDefault();
this.classList.remove('drag-over');

if (draggedTask) {
const taskId = draggedTask.dataset.id;
const columnId = this.closest('.status-column').id;
let newStatus;

// Convert column ID to status
if (columnId === 'todoColumn') newStatus = 'todo';
else if (columnId === 'progressColumn') newStatus = 'progress';
else if (columnId === 'doneColumn') newStatus = 'done';
else newStatus = 'todo';

// Find the task to get its details
const task = tasks.find(t => t.id === taskId);

// Update task status in database
db.collection('tasks').doc(taskId).update({
status: newStatus
}).then(() => {
// ADD THIS: Trigger sound and confetti when task is dropped in "Done" column
if (task && newStatus === 'done' && task.status !== 'done') {
if (confettiEnabled) {
showSimpleConfetti();
showTaskCompletedMessage(task.title);
}

if (soundEnabled) {
playCompletionSound();
}
}
}).catch(error => {
console.error('Error updating task status:', error);
});
}
}

function escapeHtml(text) {
const div = document.createElement('div');
div.textContent = text;
return div.innerHTML;
}

async function handleLogout() {
try {
if (tasksListener) {
tasksListener();
}

if (window.auth) {
await auth.signOut();
}
window.location.href = 'login.html';
} catch (error) {
console.error('Error logging out:', error);
alert('Error logging out: ' + error.message);
}
}

window.editTask = editTask;
window.deleteTask = deleteTask;
window.changeStatus = changeStatus;



