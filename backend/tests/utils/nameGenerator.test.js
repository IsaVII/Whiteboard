const {
  generateAnonymousName,
  generateRandomColor,
} = require("../../src/utils/nameGenerator");

describe("Name Generator Utility", () => {
  describe("generateAnonymousName", () => {
    test("should generate a name with an adjective and an animal", () => {
      const name = generateAnonymousName();
      expect(typeof name).toBe("string");
      expect(name).toMatch(/^\w+ \w+$/); // Two words separated by space
    });

    test("should generate different names on different calls (probabilistically)", () => {
      const names = new Set();
      // Generate 10 names and check if at least some are different
      for (let i = 0; i < 10; i++) {
        names.add(generateAnonymousName());
      }
      // With 14 adjectives and 14 animals, we should get variety
      expect(names.size).toBeGreaterThan(1);
    });

    test("should only use allowed adjectives and animals", () => {
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

      for (let i = 0; i < 20; i++) {
        const name = generateAnonymousName();
        const [adjective, animal] = name.split(" ");
        expect(ADJECTIVES).toContain(adjective);
        expect(ANIMALS).toContain(animal);
      }
    });
  });

  describe("generateRandomColor", () => {
    test("should generate a valid Tailwind color class", () => {
      const VALID_COLORS = [
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

      const color = generateRandomColor();
      expect(typeof color).toBe("string");
      expect(VALID_COLORS).toContain(color);
    });

    test("should generate different colors on different calls (probabilistically)", () => {
      const colors = new Set();
      for (let i = 0; i < 20; i++) {
        colors.add(generateRandomColor());
      }
      expect(colors.size).toBeGreaterThan(1);
    });
  });
});
