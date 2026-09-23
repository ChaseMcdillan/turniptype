# TurnipType

A minimal, indigo-themed typing test built in vanilla JS. No frameworks, no build step, no dependencies.

**Live:** https://turniptype.vercel.app

## Features
- Time modes (5s / 10s / 15s / 30s / 60s), word counts, quotes, and custom text
- 5-line focus window that scrolls as you type
- Live WPM, accuracy, and countdown
- Per-character highlighting (indigo = correct, pink = wrong)
- Results screen with a hand-drawn SVG graph of WPM over time
- Stats: raw WPM, burst, consistency, correct/wrong chars
- Personal bests saved per mode via localStorage
- Multi-language word pools (English, Spanish, French, German)
- Keyboard-first: Tab to focus, Esc to restart

## Stack
HTML · CSS · JavaScript · deployed on Vercel

## Why I built it
Wanted a clean typing test with no ads, no tracking, and a UI I actually enjoy looking at. Every design decision is intentional — single accent color, monospace body text, no shadows or gradients.

## What I'd add next
- Custom text input mode
- Account-based history across devices
- Per-word statistics (which words slow you down)
- Themes

## Built by
[Chase McDillan](https://github.com/ChaseMcDillan)