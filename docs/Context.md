# Uncut – Project Context

## Overview

Uncut is a mobile application that helps users discover and track **upcoming big-budget and highly anticipated movies**.

The goal of the app is to provide a **simple, clean interface where users can view upcoming movies, track release dates, watch trailers, and receive reminders when movies release**.

The app focuses on **major theatrical releases, blockbuster movies, and highly anticipated films**.

---

## Core Problem

Movie fans often miss announcements and release dates for upcoming big-budget movies. Information is scattered across multiple websites and social media platforms.

This app solves that problem by **centralizing upcoming movie information in one place**.

---

## Core Concept

Users open the app and immediately see a **list of upcoming major movies sorted by release date**.

Users can:

- View movie details
- Watch trailers
- Track countdown to release
- Save movies to a favorites list
- Receive notifications for release dates

---

## Target Users

**Primary users:**

- Movie enthusiasts
- Fans of major franchises (Marvel, DC, Star Wars, etc.)
- People who follow upcoming blockbuster movies

**Secondary users:**

- Casual movie watchers
- Users looking for movie recommendations
- OTT watchers
- Anime fans
- Franchise followers (Fast & Furious, Avatar, etc.)

---

## Core Features (MVP)

The first version of the app should include the following features.

### 1. Upcoming Movies List

Home screen displays upcoming movies sorted by release date.

Each movie card should include:

- Movie poster
- Title
- Release date
- Genre
- Hype score / popularity score

Users can scroll through upcoming movies grouped by month.

Example:

```
June 2026
- Avengers Secret Wars
- Dune Messiah
- Spider-Man 4
```

---

### 2. Movie Detail Page

When a user taps on a movie, a detailed screen opens.

This page should display:

- Movie poster (large)
- Movie title
- Release date
- Countdown timer until release
- Genre
- Movie description / plot summary
- Cast list
- Trailer video (YouTube embed)
- Popularity / hype score
- Budget (optional)

Example:

```
Spider-Man 4

Release: July 17, 2026
Days remaining: 142

Cast:
Tom Holland
Zendaya

Trailer: [YouTube embed]

🔥 Hype Score: 92 / 100
```

---

### 3. Countdown Timer

Each movie detail page should show how many days remain until release.

Example:

```
Release Date: July 17, 2026
Countdown: 142 days remaining
```

---

### 4. Favorites / Watchlist

Users can save movies to a favorites list.

Features:

- Add movie to favorites
- Remove movie from favorites
- View saved movies in a dedicated favorites screen

---

### 5. Search Feature

Users can search movies by title.

Search results should display matching movies from the movie database.

Users can filter by:

- Genre
- Franchise
- Language
- Year

Example filter:

```
Show only:
Action
Marvel
2026 releases
```

---

## Optional Features (Future Improvements)

These features are optional for the first version but can be added later.

- **Hype Meter** – AI analyzes online buzz and shows internet hype percentage
- **Notification reminders** for trailer releases and movie releases
- **Trending movies** section
- **Franchise tracking** (Marvel timeline, DC, etc.)
- **OTT release tracking**
- **Countdown widgets** on home screen
- **AI movie recommendations**

---

## App Screens

The app should contain the following screens:

1. **Splash Screen** – App logo and branding
2. **Home Screen** – Upcoming movies list sorted by release date
3. **Movie Detail Screen** – Full movie info, trailer, cast, countdown
4. **Search Screen** – Search and filter movies
5. **Favorites Screen** – User's saved/watchlisted movies

---

## App Flow

```
App Launch
  → Splash Screen
  → Home Screen (Upcoming Movies)

From Home Screen:
  → Tap movie card → Movie Detail Screen
  → Tap search icon → Search Screen
  → Tap favorites tab → Favorites Screen

Movie Detail Screen:
  → Watch trailer
  → View cast and description
  → Add to favorites
  → See countdown timer

Search Screen:
  → Search by title
  → Filter by genre, franchise, language, year
  → Tap result → Movie Detail Screen

Favorites Screen:
  → View saved movies
  → Remove from favorites
  → Tap movie → Movie Detail Screen
```

---

## Data Source

The app should fetch movie data from the **TMDB API (The Movie Database)**.

The API provides:

- Upcoming movies
- Posters
- Trailers
- Cast information
- Movie descriptions
- Popularity metrics

API reference: https://www.themoviedb.org/documentation/api

---

## Technology Stack

| Layer        | Technology             |
| ------------ | ---------------------- |
| Frontend     | React Native with Expo |
| Backend      | Supabase               |
| Database     | Supabase PostgreSQL    |
| External API | TMDB API               |

---

## Database Schema

### Movies Table

| Field        | Type    | Description                  |
| ------------ | ------- | ---------------------------- |
| id           | int     | Primary key                  |
| title        | text    | Movie title                  |
| release_date | date    | Theatrical release date      |
| genre        | text    | Genre(s)                     |
| poster_url   | text    | URL to movie poster image    |
| trailer_url  | text    | URL to trailer video         |
| description  | text    | Plot summary                 |
| hype_score   | int     | Popularity / hype score      |
| budget       | bigint  | Production budget (optional) |
| language     | text    | Original language            |

### Users Table

| Field    | Type | Description         |
| -------- | ---- | ------------------- |
| id       | uuid | Primary key         |
| email    | text | User email          |
| password | text | Hashed password     |

### Favorites Table

| Field    | Type | Description              |
| -------- | ---- | ------------------------ |
| id       | int  | Primary key              |
| user_id  | uuid | Foreign key → Users.id   |
| movie_id | int  | Foreign key → Movies.id  |

---

## Folder Structure

```
uncut/
├── docs/
│   └── Context.md
├── app/
│   ├── home/
│   ├── movie/
│   ├── search/
│   └── favorites/
├── components/
│   ├── MovieCard/
│   ├── CountdownTimer/
│   └── TrailerPlayer/
├── services/
│   ├── tmdbApi.js
│   └── supabase.js
└── assets/
    └── images/
```

---

## UI Design Guidelines

The UI should be clean and modern.

**Design inspiration:**

- Netflix
- IMDB
- Letterboxd

**Key design elements:**

- Dark theme
- Large movie posters
- Smooth scrolling movie lists
- Simple bottom navigation tabs
- Bold typography for movie titles
- Accent colors for hype scores and CTAs

---

## Key Goals

The goal of the project is to create a **simple and functional movie tracking app** that allows users to easily discover upcoming blockbuster movies and stay updated with release dates.

The app should prioritize:

- **Simplicity** – minimal, intuitive UI
- **Fast performance** – smooth scrolling and quick load times
- **Clean user interface** – modern dark theme design
- **Reliable data** – accurate movie info from TMDB API
