---
name: UI/UX Design for Web Games
description: Best practices for mobile-first responsive design in web games.
---

# UI/UX Best Practices for Mobile Web Games

## 1. Interaction Zones (Thumb Zone)
- Place primary actions (Play, Submit) in the bottom 30% of the screen.
- Place secondary actions (Menu, Settings) in the top corners.
- Avoid placing frequently used controls in the top center (hard to reach).

## 2. Navigation & Structure
- **Tabs**: Use a bottom tab bar or top segmented control to switch between views (Play, Leaderboard, History).
- **Collapsible Sections**: Use accordions for less critical information (e.g., detailed logs).
- **Modals**: Use bottom sheets for transient tasks (e.g., confirmation dialogs).

## 3. Visual Feedback
- **Active States**: Immediate feedback on touch (color change, scale).
- **Loading**: Use skeletons or spinners within the button itself.
- **Success/Error**: Toast notifications at the top or bottom center.

## 4. Typography & Spacing
- **Base Size**: 16px minimum for body text.
- **Headings**: Clear hierarchy (H1 > H2 > H3).
- **Whitespace**: Generous padding (minimum 16px) between touch targets.

## 5. Gamification Elements
- **Badges**: Use small notification dots or counters on tabs.
- **Animations**: Celebrate success (confetti, shake) but keep UI snappy.
- **Color Coding**: 
  - Green: Success/Go
  - Red: Danger/Stop
  - Gold: Win/High Score
  - Neutral: Information

## 6. Implementation Tips (Tailwind)
- Use `hidden md:block` to show desktop layout.
- Use `block md:hidden` to show mobile layout.
- Use `sticky` positioning for headers/footers.
- Use `h-screen` or `min-h-screen` cautiously; prefer `min-h-[100dvh]` for mobile browser chrome handling.
