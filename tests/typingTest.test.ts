import { describe, expect, it } from "bun:test";
import {
  calculateTypingScore,
  TYPING_TEST_DURATION_SECONDS,
} from "../src/lib/typingTest";
import { createMixedPassage, TYPING_PASSAGES } from "../src/lib/typingTestPassages";

describe("one-minute typing test", () => {
  it("uses the required 60-second duration", () => {
    expect(TYPING_TEST_DURATION_SECONDS).toBe(60);
  });

  it("calculates speed and accuracy from matched characters", () => {
    const score = calculateTypingScore("hello world", "hello world", 60);
    expect(score.wordsPerMinute).toBe(2);
    expect(score.accuracy).toBe(100);
    expect(score.errorCount).toBe(0);
  });

  it("counts incorrect characters toward the error total", () => {
    const score = calculateTypingScore("hxllo", "hello", 60);
    expect(score.accuracy).toBe(80);
    expect(score.errorCount).toBe(1);
    expect(score.wordsPerMinute).toBe(1);
  });

  it("mixes one passage from each supplied subject category", () => {
    const mixed = createMixedPassage(() => 0, TYPING_PASSAGES);
    expect(mixed.categories.length).toBe(4);
    expect(mixed.title.split(" · ").length).toBe(4);
    expect(mixed.text.length).toBeGreaterThan(500);
  });
});