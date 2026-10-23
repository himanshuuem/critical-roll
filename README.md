# 🎲 Critical Roll

> A fair, animated RPG dice roller: d4 to d20, multiple dice, modifiers, advantage and disadvantage, a persistent roll log, and a **two-player duel mode** that levels up the classic Dicee game.

**🔗 Live demo:** https://himanshuuem.github.io/critical-roll/

![JavaScript](https://img.shields.io/badge/ES_Modules-F7DF1E?logo=javascript&logoColor=black)
![SVG](https://img.shields.io/badge/SVG-FFB13B?logo=svg&logoColor=black)
[![test](https://github.com/himanshuuem/critical-roll/actions/workflows/test.yml/badge.svg)](https://github.com/himanshuuem/critical-roll/actions/workflows/test.yml)

## ✨ Features

- **Genuinely fair dice:** `crypto.getRandomValues` with **rejection sampling**, so there's no modulo bias (`Math.random() * 6` is slightly biased). This is covered by a test.
- **Six die types** drawn as SVG silhouettes (triangle d4 through hexagon d20), each in its own colour.
- **Roll expressions** like `3d8-1` or `1d20 (adv)`. Advantage and disadvantage roll the set twice and show the discarded result.
- **Natural 20 and natural 1** trigger a full-screen gold or red flash.
- **Roll log** of the last 25 rolls, kept in `localStorage`.
- **Duel mode:** two named players, d20 each, best of five with a crown for the winner.
- **Keyboard-friendly:** the WAI-ARIA tabs pattern, an arrow-key die picker (`role="radiogroup"`) and <kbd>R</kbd> to roll.
- Respects `prefers-reduced-motion`, which skips the tumble animation.

## 🧠 Architecture

`dice.js` holds the pure logic (rolling, advantage, crit detection, notation) with an **injectable random source**, so `dice.test.js` can assert exact outcomes. `app.js` only handles DOM and state.

## 🛠 Tech Stack

Vanilla JS ES modules · Web Crypto API · Inline SVG · CSS animations · `node:test` · GitHub Actions

## 🚀 Run Locally

```bash
git clone https://github.com/himanshuuem/critical-roll.git
cd critical-roll
npm test
npm start    # http://localhost:3000
```

## 📚 Origin

This is a reimagined **Dicee** challenge from the DOM section of [The Complete Web Development Bootcamp](https://www.udemy.com/course/the-complete-web-development-bootcamp/). The two-dice page grew into a complete tabletop dice tool.

---

Made by [Himanshu](https://github.com/himanshuuem)
