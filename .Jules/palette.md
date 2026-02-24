## 2025-05-15 - Missing Accessible Labels
**Learning:** Icon-only buttons are prevalent in the app (Tasks, Timer, ThemeStudio) but consistently lack `aria-label` and `title` attributes, making them inaccessible to screen readers and unclear for mouse users.
**Action:** Always check for `aria-label` and `title` on icon-only buttons. Adding them is a low-effort, high-impact a11y/UX win.
