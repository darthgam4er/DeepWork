## 2024-03-12 - Missing accessible names on icon-only buttons
**Learning:** Found that multiple icon-only interactive elements (status toggles, edit, delete, close buttons) in the app were missing accessible names, leading to poor screen reader support and lacking tooltips.
**Action:** Always add `aria-label` and `title` to buttons that only contain an icon, especially in lists where there are multiple repetitive icons.
