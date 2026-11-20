export const TYPING_TEST_DURATION_SECONDS = 60;

export interface TypingScore {
  wordsPerMinute: number;
  accuracy: number;
  charactersTyped: number;
  correctCharacters: number;
  errorCount: number;
}

export function calculateTypingScore(
  typedText: string,
  targetText: string,
  durationSeconds: number = TYPING_TEST_DURATION_SECONDS,
): TypingScore {
  const charactersTyped = typedText.length;
  let correctCharacters = 0;

  for (let index = 0; index < charactersTyped; index += 1) {
    if (typedText[index] === targetText[index]) correctCharacters += 1;
  }

  const errorCount = charactersTyped - correctCharacters;
  const elapsedMinutes = durationSeconds / 60;

  return {
    wordsPerMinute:
      elapsedMinutes > 0
        ? Math.round(correctCharacters / 5 / elapsedMinutes)
        : 0,
    accuracy:
      charactersTyped > 0
        ? Math.round((correctCharacters / charactersTyped) * 100)
        : 0,
    charactersTyped,
    correctCharacters,
    errorCount,
  };
}