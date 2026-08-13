// Generate random, friendly anonymous user names

const ADJECTIVES = [
  "Anonymous",
  "Curious",
  "Sneaky",
  "Happy",
  "Sleepy",
  "Brave",
  "Clever",
  "Gentle",
  "Jolly",
  "Mighty",
  "Quiet",
  "Swift",
  "Witty",
  "Zesty",
];

const ANIMALS = [
  "Elephant",
  "Otter",
  "Fox",
  "Panda",
  "Falcon",
  "Koala",
  "Tiger",
  "Penguin",
  "Dolphin",
  "Badger",
  "Raccoon",
  "Owl",
  "Wolf",
  "Lynx",
];

const COLORS = [
  "bg-yellow-400",
  "bg-blue-400",
  "bg-purple-400",
  "bg-pink-400",
  "bg-green-400",
  "bg-red-400",
  "bg-indigo-400",
  "bg-cyan-400",
  "bg-orange-400",
  "bg-teal-400",
];

// Select random item from array
function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Generate a fun random name (e.g., "Curious Otter" or "Brave Falcon")
// Caller may append ID suffix if globally unique names are needed
function generateAnonymousName() {
  const adjective = randomFrom(ADJECTIVES);
  const animal = randomFrom(ANIMALS);
  return `${adjective} ${animal}`;
}

// Generate a random Tailwind color class for user badges
function generateRandomColor() {
  return randomFrom(COLORS);
}

module.exports = { generateAnonymousName, generateRandomColor };
