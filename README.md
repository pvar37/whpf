# Who He Play For?

*your daily test of ball knowledge*

A daily NBA guessing game inspired by the legendary *"Who He Play For?"* segment on **Inside the NBA**.

Live at: [https://whpf.pranayvarada.com](https://whpf.pranayvarada.com)

## Features

- **Daily 5 Challenge**: Guess which team 5 selected NBA players currently represent, seeded daily using Mulberry32 PRNG.
- **Cropped Headshots**: Headshots are pre-zoomed onto the face during guessing to avoid uniform color giveaways, with smooth reveal on guess.
- **Fast Autocomplete Search**: Search all 30 NBA teams by team name, city, nickname, abbreviation, or alias with official team logos.
- **Score & Share**: Track your progress and share your daily score with emoji grids via the native share sheet or clipboard.

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) + Barlow font
- **Data**: NBA official statistics API (scraped via `scripts/files.py`)
