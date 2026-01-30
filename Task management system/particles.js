// Initialize particles for background
function initParticles() {
const particlesContainer = document.createElement('div');
particlesContainer.className = 'particles';
document.body.appendChild(particlesContainer);

// Create particles for main page
if (document.querySelector('.container')) {
for (let i = 0; i < 50; i++) {
createParticle(particlesContainer);
}
}
// Create particles for login page
else if (document.querySelector('.auth-container')) {
const floatingShapes = document.createElement('div');
floatingShapes.className = 'floating-shapes';
document.querySelector('.auth-container').appendChild(floatingShapes);

for (let i = 0; i < 4; i++) {
const shape = document.createElement('div');
shape.className = 'shape';
floatingShapes.appendChild(shape);
}
}
}

function createParticle(container) {
const particle = document.createElement('div');
particle.className = 'particle';

// Random size and position
const size = Math.random() * 4 + 1;
const x = Math.random() * 100;
const y = Math.random() * 100;
const duration = Math.random() * 20 + 10;
const delay = Math.random() * -20;

particle.style.width = `${size}px`;
particle.style.height = `${size}px`;
particle.style.left = `${x}%`;
particle.style.top = `${y}%`;
particle.style.animationDuration = `${duration}s`;
particle.style.animationDelay = `${delay}s`;

container.appendChild(particle);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initParticles);


