// notifications.js
// Deadline reminder functions with deadline-aware duplicate prevention and sound

// Show a toast notification for a task approaching deadline
function showDeadlineWarning(task) {
// Avoid duplicate if this exact task+deadline already notified this session
const notified = JSON.parse(sessionStorage.getItem('deadlineNotified') || '[]');
const alreadyNotified = notified.some(entry => entry.id === task.id && entry.deadline === task.deadline);
if (alreadyNotified) return;

// Play sound only if sound is enabled globally (default true)
if (typeof window.soundEnabled === 'undefined' || window.soundEnabled) {
playReminderSound();
}

const message = document.createElement('div');
message.style.position = 'fixed';
message.style.top = '20px';
message.style.right = '20px';
message.style.backgroundColor = '#f59e0b'; // warning orange
message.style.color = 'white';
message.style.padding = '15px 25px';
message.style.borderRadius = '10px';
message.style.zIndex = '10000';
message.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
message.style.fontWeight = '500';
message.style.display = 'flex';
message.style.alignItems = 'center';
message.style.gap = '10px';

// Build message that includes category (if available) to clearly identify the program/subject
const categoryInfo = task.category && task.category !== 'Other' ? ` (${escapeHtml(task.category)})` : '';
message.innerHTML = `
<i class="fas fa-exclamation-triangle" style="font-size: 1.2rem;"></i>
<div>
<div style="font-weight: 600;">Deadline approaching!</div>
<div style="font-size: 0.9rem; opacity: 0.9;">
${escapeHtml(task.title)}${categoryInfo} is due on ${escapeHtml(task.deadline)}
</div>
</div>
`;

document.body.appendChild(message);

// Animate in
message.animate([
{ transform: 'translateX(100%)', opacity: 0 },
{ transform: 'translateX(0)', opacity: 1 }
], {
duration: 500,
easing: 'ease-out'
});

// Mark as notified for this specific deadline
notified.push({ id: task.id, deadline: task.deadline });
sessionStorage.setItem('deadlineNotified', JSON.stringify(notified));

// Auto remove after 5 seconds
setTimeout(() => {
message.animate([
{ transform: 'translateX(0)', opacity: 1 },
{ transform: 'translateX(100%)', opacity: 0 }
], {
duration: 500,
easing: 'ease-in'
}).onfinish = () => {
if (message.parentNode) message.remove();
};
}, 5000);
}

// Play a gentle reminder sound (two-tone beep)
function playReminderSound() {
try {
const AudioContext = window.AudioContext || window.webkitAudioContext;
if (!AudioContext) return;

const audioContext = new AudioContext();

// If the context is suspended, try to resume it (requires user interaction, but may work if already unlocked)
if (audioContext.state === 'suspended') {
audioContext.resume().then(() => {
playBeep(audioContext);
}).catch(e => console.log('Could not resume audio context:', e));
} else {
playBeep(audioContext);
}
} catch (error) {
console.log('Reminder sound error:', error);
}
}

function playBeep(audioContext) {
const oscillator = audioContext.createOscillator();
const gainNode = audioContext.createGain();

oscillator.connect(gainNode);
gainNode.connect(audioContext.destination);

const now = audioContext.currentTime;

// Two short beeps
oscillator.frequency.setValueAtTime(880, now);        // A5
oscillator.frequency.setValueAtTime(660, now + 0.15); // E5

gainNode.gain.setValueAtTime(0.15, now);
gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

oscillator.start(now);
oscillator.stop(now + 0.4);
}

// Check all tasks for upcoming deadlines (within 3 days, not done)
function checkDeadlineReminders(tasks) {
if (!tasks || tasks.length === 0) return;

const today = new Date();
today.setHours(0, 0, 0, 0); // start of today

tasks.forEach(task => {
// Skip if already done or no deadline
if (task.status === 'done' || task.deadline === 'No deadline') return;

// Parse deadline (assumes YYYY-MM-DD format)
const deadlineParts = task.deadline.split('-');
if (deadlineParts.length !== 3) return;
const deadlineDate = new Date(
parseInt(deadlineParts[0]),
parseInt(deadlineParts[1]) - 1,
parseInt(deadlineParts[2])
);
deadlineDate.setHours(0, 0, 0, 0);

const diffTime = deadlineDate - today;
const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

// Show warning if due within next 3 days (including today)
if (diffDays >= 0 && diffDays <= 3) {
showDeadlineWarning(task);
}
});
}

// Optional: Clean up notifications for tasks that are now done or past deadline
function cleanupOldNotifications(tasks) {
const notified = JSON.parse(sessionStorage.getItem('deadlineNotified') || '[]');
const activeIdsAndDeadlines = tasks
.filter(t => t.status !== 'done' && t.deadline !== 'No deadline')
.map(t => ({ id: t.id, deadline: t.deadline }));

const filtered = notified.filter(entry =>
activeIdsAndDeadlines.some(active => active.id === entry.id && active.deadline === entry.deadline)
);

if (filtered.length !== notified.length) {
sessionStorage.setItem('deadlineNotified', JSON.stringify(filtered));
}
}

// Helper to escape HTML (copied from your existing scripts)
function escapeHtml(text) {
const div = document.createElement('div');
div.textContent = text;
return div.innerHTML;
}

// Render a persistent list of tasks due within 3 days (not done)
function renderDueSoon(tasks) {
const dueSoonContainer = document.getElementById('dueSoonList');
if (!dueSoonContainer) return;

// Get or create the content div
let contentDiv = document.getElementById('dueSoonContent');
if (!contentDiv) {
// If the HTML structure is not updated, fall back to simple rendering
contentDiv = dueSoonContainer;
}

const today = new Date();
today.setHours(0, 0, 0, 0);

// Filter tasks: not done, valid deadline, within next 3 days
const dueSoonTasks = tasks.filter(task => {
if (task.status === 'done' || task.deadline === 'No deadline') return false;
const deadlineParts = task.deadline.split('-');
if (deadlineParts.length !== 3) return false;
const deadlineDate = new Date(
parseInt(deadlineParts[0]),
parseInt(deadlineParts[1]) - 1,
parseInt(deadlineParts[2])
);
deadlineDate.setHours(0, 0, 0, 0);
const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
return diffDays >= 0 && diffDays <= 3;
});

if (dueSoonTasks.length === 0) {
contentDiv.innerHTML = '<p class="due-soon-empty">No tasks due soon ✅</p>';
return;
}

// Sort by deadline (earliest first)
dueSoonTasks.sort((a, b) => a.deadline.localeCompare(b.deadline));

let html = '<ul class="due-soon-list">';
dueSoonTasks.forEach(task => {
const daysLeft = calculateDaysLeft(task.deadline);
const dayText = daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `In ${daysLeft} days`;
const category = task.category && task.category !== 'Other' ? ` (${escapeHtml(task.category)})` : '';
html += `
<li>
<span class="due-soon-title">${escapeHtml(task.title)}${category}</span>
<span class="due-soon-deadline">${escapeHtml(task.deadline)} (${dayText})</span>
</li>
`;
});
html += '</ul>';
contentDiv.innerHTML = html;
}

// Helper to calculate days left from today (used above)
function calculateDaysLeft(deadlineStr) {
const today = new Date();
today.setHours(0, 0, 0, 0);
const deadlineParts = deadlineStr.split('-');
if (deadlineParts.length !== 3) return 999;
const deadlineDate = new Date(
parseInt(deadlineParts[0]),
parseInt(deadlineParts[1]) - 1,
parseInt(deadlineParts[2])
);
deadlineDate.setHours(0, 0, 0, 0);
return Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
}

// In notifications.js, after renderDueSoon and helpers

function initDueSoonToggle() {
const toggleBtn = document.getElementById('dueSoonToggle');
const content = document.getElementById('dueSoonContent');
if (!toggleBtn || !content) return;

// Load saved state from localStorage
const isCollapsed = localStorage.getItem('dueSoonCollapsed') === 'true';
if (isCollapsed) {
content.classList.add('collapsed');
toggleBtn.querySelector('i').classList.replace('fa-chevron-up', 'fa-chevron-down');
}

toggleBtn.addEventListener('click', () => {
content.classList.toggle('collapsed');
const icon = toggleBtn.querySelector('i');
if (content.classList.contains('collapsed')) {
icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
localStorage.setItem('dueSoonCollapsed', 'true');
} else {
icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
localStorage.setItem('dueSoonCollapsed', 'false');
}
});
}

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', initDueSoonToggle);

