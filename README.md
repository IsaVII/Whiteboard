# Whiteboard

A real-time collaborative whiteboard web application built to practice **React-Redux** state management and **WebSockets**, enabling multiple users to draw and interact together on the same canvas simultaneously.

## Features

- Real-time synchronization across multiple connected users via WebSockets
- Centralized application state managed with Redux
- Live cursor/interaction updates between participants
- MongoDB connection for persisting board data
- Debug panel for easier mobile debugging

## Screenshots

| ![Screenshot 1](./screenshots/screenshot-1.png) | ![Screenshot 2](./screenshots/screenshot-2.png) |
| ----------------------------------------------- | ----------------------------------------------- |
| ![Screenshot 3](./screenshots/screenshot-3.png) |

## Tech Stack

- **Frontend:** React, Redux
- **Backend:** Node.js, WebSockets
- **Database:** MongoDB

## Getting Started

```bash
# Clone the repository
git clone https://github.com/IsaVII/Whiteboard.git
cd Whiteboard

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

Run the backend and frontend servers separately, then open the app in your browser to start drawing collaboratively.

## Status

This project is a work in progress, built primarily as a learning exercise for React-Redux and WebSocket-based real-time multi-user interaction.
