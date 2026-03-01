# Final Testing Report - Sprint 2

## Test Conducted by: @Magic-Maggie, @kokeng123eng, @lensheng123-jpg


## Browser Compatibility Results:
- Chrome 98: ✅ All features working
- Firefox 96: ✅ All features working
- Safari 15: ✅ All features working
- Edge 98: ✅ All features working


## Feature Testing Summary:
| Feature | Result | Tester |
|---------|--------|--------|
| Task Editing | ✅ Pass | @Magic-Maggie |
| Task Deletion | ✅ Pass | @kokeng123eng |
| Status Management | ✅ Pass | @linsheng123-jpg |
| Task Filtering | ✅ Pass | @Magic-Maggie |
| Kanban Board | ✅ Pass | @linsheng123-jpg |
| Categories | ✅ Pass | @linsheng123-jpg |
| Priority System | ✅ Pass | @Magic-Maggie |
| Confetti Animation | ✅ Pass | @kokeng123eng |
| Sound Effects | ✅ Pass | @kokeng123eng |

## Notification System Testing

| Test Case | Description | Expected Result | Status | Tester |
|-----------|-------------|-----------------|--------|--------|
| TC-15 | Create a task with deadline 2 days from today | Toast notification appears and sound plays when the page is refreshed or after real‑time update. | ✅ Pass | @kokeng123eng |
| TC-16 | Mark a due task as “Done” | Notification for that task no longer appears; task disappears from Due Soon panel. | ✅ Pass | @lensheng123-jpg |
| TC-17 | Open board page with tasks due soon | Due Soon panel shows correct tasks with accurate day labels (e.g., “Today”, “Tomorrow”). | ✅ Pass | @Magic-Maggie |
| TC-18 | Toggle the Due Soon panel collapsed/expanded | State persists after page reload. | ✅ Pass | @kokeng123eng |

## Email Notification System Testing

| Test Case | Description | Expected Result | Status | Tester |
|-----------|-------------|-----------------|--------|--------|
| TC-19 | User has task due in 3 days with status not done | Email reminder is sent to user's registered email address | ✅ Pass | @kokeng123eng |
| TC-20 | User has multiple tasks due in 3 days | Single email containing all tasks is sent | ✅ Pass | @Magic-Maggie |
| TC-21 | User has no tasks due in 3 days | No email is sent | ✅ Pass | @lensheng123-jpg |
| TC-22 | Task marked as done before the reminder runs | No email is sent for that task | ✅ Pass | @kokeng123eng |
| TC-23 | Verify email content includes task titles and deadline | Email contains correct task list | ✅ Pass | @Magic-Maggie |


## Performance Metrics:
- Lighthouse Score: 92/100
- Page Load Time: < 2 seconds
- No console errors detected

## Conclusion:
All Sprint 2 features are working correctly and ready for release.
