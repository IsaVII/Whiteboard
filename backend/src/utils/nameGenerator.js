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

module.exports = { generateAnonymousName };
