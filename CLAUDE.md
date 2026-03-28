# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # install dependencies
npm run dev       # start dev server (http://localhost:5173)
npm run build     # production build → dist/
npm run preview   # preview the production build
```

## Architecture

Phaser 3 platform game using Vite for bundling. Entry point is `src/main.js`, which registers all scenes and creates the Phaser game instance with arcade physics.

**Scene flow:** `Boot` → `Preloader` → `MainMenu` → `Game` → `GameOver`

- `Boot` — loads any assets needed before the loading bar itself appears, then starts `Preloader`
- `Preloader` — loads all game assets (sprites, tilemaps, audio); add `this.load.*` calls here
- `MainMenu` / `GameOver` — UI-only scenes, transition to `Game` on SPACE
- `Game` — main gameplay scene; owns the `platforms` static group and the `Player` instance; levels will populate `platforms`

**Entities (`src/entities/`)** — `Phaser.Physics.Arcade.Sprite` subclasses. `Player` handles input and double-jump logic inside its own `update(cursors)` method, called from the `Game` scene's `update`.

## Adding content

- **Sprites:** load in `Preloader`, pass the texture key to the relevant entity constructor or `create` call
- **Levels:** populate `this.platforms` in `Game.create()` (or extract to a level class/data file)
- **New entities:** extend `Phaser.Physics.Arcade.Sprite`, add to `src/entities/`, wire colliders in `Game`
