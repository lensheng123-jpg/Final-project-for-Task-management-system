//T2-01: Task editing implemented by @Magic-Maggie-Sprint 2
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
  
  Add: // T2-04: Task filtering by @Magic-Maggie - Sprint 2

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

  // T2-09: Priority system by @Magic-Maggie

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
}// T2-02: Task deletion by @kokeng123eng
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

function renderTasks() {
const taskList = document.getElementById('taskList');
if (!taskList) return;

const statusFilter = document.getElementById('statusFilter');
const filter = statusFilter ? statusFilter.value : 'all';

let filteredTasks = tasks;
if (filter !== 'all') {
filteredTasks = tasks.filter(task => task.status === filter);
}

taskList.innerHTML = '';

if (filteredTasks.length === 0) {
taskList.innerHTML = `
<div class="task" style="text-align: center; padding: 40px;">
<h3>No tasks found</h3>
<p>${filter === 'all' ? 'Add your first task using the form on the left!' : 'No tasks with this status'}</p>
</div>
`;
return;
}

filteredTasks.forEach(task => {
const taskElement = document.createElement('div');
taskElement.className = 'task';
taskElement.setAttribute('data-status', task.status);

const statusColors = {
todo: '#ef4444',
progress: '#f59e0b',
done: '#10b981'
};

taskElement.style.borderLeftColor = statusColors[task.status] || '#667eea';

let formattedDate = 'No date';
if (task.createdAt && task.createdAt instanceof Date) {
formattedDate = task.createdAt.toLocaleDateString('en-US', {
year: 'numeric',
month: 'short',
day: 'numeric'
});
}

taskElement.innerHTML = `
<div class="task-info">
<h3>${escapeHtml(task.title || 'Untitled')}</h3>
<p>${escapeHtml(task.description || 'No description')}</p>
<p class="deadline"><i class="far fa-calendar-alt"></i> ${escapeHtml(task.deadline || 'No deadline')}</p>
<small>Created: ${formattedDate}</small>
<br>
<small>Status: <strong>${(task.status || 'todo').toUpperCase()}</strong></small>
<br>
<small>Category: <strong>${escapeHtml(task.category || 'Other')}</strong></small>
<br>
<small>Priority: <strong>${escapeHtml(task.priority || 'other')}</strong></small>
</div>
<div class="task-actions">
<button class="edit-btn" data-id="${task.id}">
<i class="fas fa-edit"></i> Edit
</button>
<button class="status-btn" data-id="${task.id}">
<i class="fas fa-exchange-alt"></i> Status
</button>
<button class="delete-btn" data-id="${task.id}">
<i class="fas fa-trash"></i> Delete
</button>
</div>
`;

const editBtn = taskElement.querySelector('.edit-btn');
const statusBtn = taskElement.querySelector('.status-btn');
const deleteBtn = taskElement.querySelector('.delete-btn');

editBtn.addEventListener('click', () => editTask(task.id));
statusBtn.addEventListener('click', () => changeStatus(task.id));
deleteBtn.addEventListener('click', () => deleteTask(task.id));

taskList.appendChild(taskElement);
});
}

function escapeHtml(text) {
const div = document.createElement('div');
div.textContent = text;
return div.innerHTML;
}
// T2-05: Statistics dashboard by @kokeng123eng - Sprint 2
function updateStats() {
const totalTasks = document.getElementById('totalTasks');
const todoTasks = document.getElementById('todoTasks');
const progressTasks = document.getElementById('progressTasks');
const doneTasks = document.getElementById('doneTasks');

if (totalTasks) totalTasks.textContent = tasks.length;
if (todoTasks) todoTasks.textContent = tasks.filter(t => t.status === 'todo').length;
if (progressTasks) progressTasks.textContent = tasks.filter(t => t.status === 'progress').length;
if (doneTasks) doneTasks.textContent = tasks.filter(t => t.status === 'done').length;
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

// ========== SOUND FUNCTION ==========
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

function showTaskAddedAnimation() {
const taskList = document.getElementById('taskList');
if (taskList) {
taskList.style.transition = 'all 0.3s';
taskList.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';

const notification = document.createElement('div');
notification.style.position = 'fixed';
notification.style.top = '20px';
notification.style.right = '20px';
notification.style.backgroundColor = '#3b82f6';
notification.style.color = 'white';
notification.style.padding = '10px 20px';
notification.style.borderRadius = '8px';
notification.style.zIndex = '10000';
notification.innerHTML = '<i class="fas fa-check"></i> Task added successfully!';

document.body.appendChild(notification);

setTimeout(() => {
taskList.style.backgroundColor = 'transparent';
notification.remove();
}, 1500);
}
}

// Make functions globally available
window.editTask = editTask;
window.deleteTask = deleteTask;
window.changeStatus = changeStatus;



