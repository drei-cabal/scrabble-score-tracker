# Future Scrabble Tracker Improvements

This document outlines potential features and enhancements for the Scrabble Score Tracker.

## 1. Dictionary Integration
Integrate a Dictionary API (e.g., Merriam-Webster or Free Dictionary API).
- **Auto-Validation:** Instantly check if a word is valid before it's added.
- **Definitions:** Show the meaning of a complex word when it's clicked in the "Recent" list.

## 2. Tile Bag Management (In Progress)
Track the physical tile bag's state.
- **Inventory Tracker:** Show how many tiles are left in the bag.
- **Decrement Logic:** Automatically reduce tile counts when words are played.

## 3. Match History & Lifetime Stats
Enable Supabase Auth to track player accounts.
- **Performance Over Time:** Graphs showing score trends.
- **Record Books:** "Highest Word Score," "Longest Word," and "Most Wins."
- **Game Replays:** Move-by-move history of previous matches.

## 4. Enhanced Board Visualization (Ghost Board)
Add a Digital Representation of the physical board.
- **Grid Tracker:** Help users "place" words on a virtual grid to ensure multipliers are tracked correctly.

## 5. Visual Polish & Micro-interactions
Make the app feel more premium.
- **Leaderboard Animations:** Use `framer-motion` for row swapping.
- **Sound Effects:** Tile "clinks" and game-end fanfares.
- **Confetti:** Visual celebration for the winner.

## 6. Progressive Web App (PWA)
Full mobile support.
- **Install to Home Screen:** Enable "Add to Home Screen" functionality.
- **Offline Reliability:** Enhanced caching for spotty connections.

## 7. Challenge Feature
A formal system for challenging words.
- **System Check:** Verify challenged words against a dictionary, with penalties for both failed challenges and invalid words.
