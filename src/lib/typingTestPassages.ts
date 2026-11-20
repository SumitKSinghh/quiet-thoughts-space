export interface TypingPassage {
  title: string;
  category: string;
  text: string;
}

export const TYPING_PASSAGES: TypingPassage[] = [
  {
    title: "A Tale of Two Cities",
    category: "Classic literature",
    text: "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair, we had everything before us, we had nothing before us.",
  },
  {
    title: "Walden",
    category: "Classic literature",
    text: "I went to the woods because I wished to live deliberately, to front only the essential facts of life, and see if I could not learn what it had to teach, and not, when I came to die, discover that I had not lived. I wanted to live deep and suck out all the marrow of life, to live so sturdily and Spartan-like as to put to rout all that was not life.",
  },
  {
    title: "Pride and Prejudice",
    category: "Classic literature",
    text: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.",
  },
  {
    title: "The Great Gatsby",
    category: "Classic literature",
    text: "In my younger and more vulnerable years my father gave me some advice that I have been turning over in my mind ever since. Whenever you feel like criticizing anyone, he told me, just remember that all the people in this world have not had the advantages that you have had. He did not say any more, but we have always been unusually communicative in a reserved way.",
  },
  {
    title: "Stoic Reflections",
    category: "Philosophy",
    text: "You have power over your mind, not outside events. Realize this, and you will find strength. When you arise in the morning, think of what a precious privilege it is to be alive: to breathe, to think, to enjoy, and to love. The happiness of your life depends upon the quality of your thoughts, so guard your attention with patience and deliberate care.",
  },
  {
    title: "On Time & Action",
    category: "Philosophy",
    text: "It is not that we have a short time to live, but that we waste a great deal of it. We suffer more often in imagination than in reality, postponing meaningful work while waiting for perfect conditions that never arrive. Begin at once to live, and count each separate day as a separate life, complete in its own purpose and opportunity.",
  },
  {
    title: "Self-Reliance",
    category: "Philosophy",
    text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment. What lies behind us and what lies before us are tiny matters compared to what lies within us. Trust your own quiet convictions, finish each day and be done with it, and step into tomorrow with a clear mind and unhurried determination.",
  },
  {
    title: "The Compound Effect of Daily Habits",
    category: "Mindset",
    text: "Small daily improvements rarely look impressive in the moment, yet they quietly reshape the trajectory of a decade. Reading ten pages, writing one honest paragraph, or walking for twenty minutes feels almost effortless on a Tuesday afternoon. Stick with those quiet promises long enough, and consistency begins to outperform intensity every single time.",
  },
  {
    title: "Clarity Through Writing",
    category: "Mindset",
    text: "Writing is not merely a way to record what you already think; it is the sharpest tool for discovering what you actually mean. When tangled worries leave your head and land on a blank page, they shrink to their true size. Five minutes of honest reflection each evening can turn a noisy, overwhelming week into a set of calm, actionable next steps.",
  },
  {
    title: "Deep Focus in a Distracted World",
    category: "Mindset",
    text: "Modern notifications fragment our attention into shallow, restless bursts, leaving us exhausted without ever feeling accomplished. True creative breakthroughs require stretches of uninterrupted silence where a single problem can unfold without interference. Protect even one focused hour each morning, close every unnecessary tab, and let deliberate work replace frantic busyness.",
  },
  {
    title: "Resilience & Long-Term Thinking",
    category: "Mindset",
    text: "Every meaningful craft passes through a quiet valley where effort climbs steadily while visible results appear frozen in place. Most people mistake that silence for failure and walk away just before the foundation locks together. Treat setbacks as data rather than verdicts, refine your process with curiosity, and stay in the room long enough for your work to compound.",
  },
  {
    title: "Dr. A.P.J. Abdul Kalam",
    category: "Influential lives",
    text: "Born into a modest boat-owner's family in Rameswaram, Avul Pakir Jainulabdeen Abdul Kalam sold newspapers as a boy to support his education. Through relentless curiosity and disciplined study, he went on to lead India's space and missile programs before becoming the nation's eleventh president. Even at the highest office, he remained a teacher at heart, urging young minds to dream boldly and work without pause.",
  },
  {
    title: "Marie Curie",
    category: "Influential lives",
    text: "Working in a drafty, leaking shed in Paris with minimal funding, Marie Curie spent years processing tons of pitchblende ore by hand to isolate two previously unknown elements: polonium and radium. She became the first person in history to win two Nobel Prizes in different scientific fields, physics and chemistry, proving that patient experimentation and fierce intellectual courage can permanently expand human knowledge.",
  },
  {
    title: "Nelson Mandela",
    category: "Influential lives",
    text: "Imprisoned for twenty-seven years for opposing apartheid in South Africa, Nelson Mandela refused to let confinement harden his spirit into bitterness. He spent decades studying, listening, and preparing for reconciliation rather than revenge. Upon his release, he guided a divided nation through a peaceful democratic transition, demonstrating that moral steadiness and forgiveness can outlast even the most entrenched injustice.",
  },
  {
    title: "Leonardo da Vinci",
    category: "Influential lives",
    text: "Leonardo da Vinci carried leather-bound notebooks everywhere he went, filling thousands of pages with sketches of swirling water, human anatomy, bird wings, and mechanical gears. He never separated art from science, believing that painting required understanding how light bends and how muscles move beneath the skin. His legacy reminds us that extraordinary originality begins with noticing the everyday details everyone else walks past.",
  },
];

export interface MixedPassage {
  title: string;
  text: string;
  categories: string[];
}

export function createMixedPassage(
  random: () => number = Math.random,
  passages: TypingPassage[] = TYPING_PASSAGES,
): MixedPassage {
  const categories = [...new Set(passages.map((passage) => passage.category))];
  const selected = categories.map((category) => {
    const options = passages.filter((passage) => passage.category === category);
    return options[Math.floor(random() * options.length)];
  });

  for (let index = selected.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [selected[index], selected[swapIndex]] = [selected[swapIndex], selected[index]];
  }

  return {
    title: selected.map((passage) => passage.title).join(" · "),
    text: selected.map((passage) => passage.text).join(" "),
    categories,
  };
}