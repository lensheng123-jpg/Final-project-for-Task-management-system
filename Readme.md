# 🚀 TaskFlow - Advanced Task Management System

## 📋 Project Overview
TaskFlow is a comprehensive web-based task management system developed using **Agile Scrum methodology** over two sprints. The system features user authentication, real-time task management, interactive Kanban board, and advanced filtering capabilities, and **automatic email reminders** for upcoming deadlines.

## 🏆 Features
- 🔐 **User Authentication** - Secure registration/login with Firebase
- 📝 **Task Management** - Create, Read, Update, Delete tasks
- 🎯 **Kanban Board** - Drag & drop task organization
- 📊 **Statistics Dashboard** - Real-time progress tracking
- 🏷️ **Categories & Priorities** - Organize by type and urgency
- ⏰ **Deadline Notifications** - Visual and sound alerts for tasks due within 3 days
- 📧 **Email Reminders** - Automatic daily emails sent to users when tasks are due in 3 days (via Google Apps Script)
- 📋 **Due Soon List** - Quick overview of upcoming deadlines
- 🎉 **Completion Celebrations** - Confetti and success sounds when tasks are marked done
- 🔄 **Real-time Updates** - Instant sync across all views
- 📱 **Responsive Design** - Works on all devices

## 👥 Team Members & Roles
| Role | Name | Responsibilities | GitHub |
|------|------|------------------|--------|
| **Product Owner** | Mou Chai Shan | Product vision, user stories, documentation | [@Magic-Maggie](https://github.com/Magic-Maggie) |
| **Scrum Master** | Na Kuan Ren | Sprint planning, Scrum tracking, GitHub board | [@kokeng1234eng-prog](https://github.com/kokeng1234eng-prog) |
| **Developer** | Na Kuan Li | System development, testing, implementation | [@lensheng123-jpg](https://github.com/lensheng123-jpg) |

## 🛠️ Technologies Used
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Firebase Authentication & Firestore
- **Storage:** LocalStorage API (fallback)
- **Notifications:** Web Audio API for sound, sessionStorage for duplicate prevention
- **Email Notifications:** Google Apps Script, GmailApp, Firebase Admin SDK
- **Version Control:** Git & GitHub
- **Methodology:** Agile Scrum
- **Hosting:** GitHub Pages

## 📊 Agile Process
We followed Scrum methodology with **2 sprints**:

### **Sprint 1 (Week 1-2): Foundation**
- Goal: Build authentication and basic task management
- Completed: US-01 to US-04
- Velocity: 21 story points

### **Sprint 2 (Week 3-4): Enhancement**
- Goal: Complete all features and polish
- Completed: US-05 to US-14 (including notification system)
- Velocity: 25 story points

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (for Firebase)
- Git (for development)

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/TaskFlow.git
   cd TaskFlow
