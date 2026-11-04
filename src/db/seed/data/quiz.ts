import type { QuizProfile, QuizQuestion, WineFilterType } from '../../../types/content.ts'

export const quiz: QuizQuestion[] = [
  {
    q: 'How do you take your coffee?',
    answers: [
      { label: 'Black espresso, no sugar', styles: { Red: 2, Orange: 1 }, bold: 1 },
      { label: 'Flat white, a little milk', styles: { White: 1, Rosé: 1 } },
      { label: 'Iced, with tonic and lemon', styles: { Sparkling: 2, White: 1 }, bold: -1 },
      { label: 'I’m a tea person', styles: { Orange: 2 } },
    ],
  },
  {
    q: 'Pick a citrus.',
    answers: [
      { label: 'Lemon, straight from the wedge', styles: { White: 2, Sparkling: 1 }, bold: -1 },
      { label: 'Blood orange', styles: { Rosé: 2, Red: 1 } },
      { label: 'Bitter marmalade', styles: { Orange: 2 } },
      { label: 'Not really for me', styles: { Red: 2 }, bold: 1 },
    ],
  },
  {
    q: 'The cheese board arrives. You go for…',
    answers: [
      { label: 'Fresh goat’s cheese', styles: { White: 2, Sparkling: 1 }, bold: -1 },
      { label: 'Something aged and hard', styles: { Red: 2 }, bold: 1 },
      { label: 'The smelly washed-rind one', styles: { Orange: 2 } },
      { label: 'Burrata', styles: { Rosé: 1, Sparkling: 1 } },
    ],
  },
  {
    q: 'Chocolate?',
    answers: [
      { label: '85% dark', styles: { Red: 2 }, bold: 1 },
      { label: 'Milk, please', styles: { Rosé: 1, White: 1 } },
      { label: 'With sea salt', styles: { Orange: 1, Red: 1 } },
      { label: 'I’d rather have crisps', styles: { Sparkling: 1, White: 1 }, bold: -1 },
    ],
  },
  {
    q: 'Sour things — pickles, sourdough, kombucha?',
    answers: [
      { label: 'The sourer the better', styles: { Sparkling: 2, Orange: 1 }, bold: -1 },
      { label: 'Sometimes', styles: { White: 1, Rosé: 1 } },
      { label: 'Not my thing', styles: { Red: 1 }, bold: 1 },
    ],
  },
  {
    q: 'A weekday dinner looks like…',
    answers: [
      { label: 'Something off the grill', styles: { Red: 2 }, bold: 1 },
      { label: 'Fish or shellfish', styles: { White: 2 } },
      { label: 'Spicy — curry, harissa, chilli', styles: { Orange: 1, Rosé: 1, Sparkling: 1 } },
      { label: 'A big bowl of vegetables', styles: { White: 1, Rosé: 1, Orange: 1 }, bold: -1 },
    ],
  },
  {
    q: 'When do you open a bottle?',
    answers: [
      { label: 'Long lunch outdoors', styles: { Rosé: 1, Sparkling: 1 }, bold: -1 },
      { label: 'A slow dinner with friends', styles: { Red: 1, Orange: 1 }, bold: 1 },
      { label: 'Aperitivo, before anything else', styles: { Sparkling: 2 }, bold: -1 },
      { label: 'One glass, late, with a book', styles: { Orange: 1, Red: 1 } },
    ],
  },
  {
    q: 'How adventurous should the box be?',
    answers: [
      { label: 'Keep it classic', styles: { Red: 1, White: 1 } },
      { label: 'Somewhere in between', styles: {} },
      { label: 'Surprise me', styles: { Orange: 2, Sparkling: 1 } },
    ],
  },
]

export const quizProfiles: Record<WineFilterType, QuizProfile> = {
  Red: {
    title: 'Red earth',
    text: 'You like grip, savoury fruit and something to chew on. Iron-rich Teran and coastal Plavac will feel like home.',
  },
  White: {
    title: 'Salt & stone',
    text: 'Bright, saline and clean. You want wine that tastes like the coast — island whites, lunch wines, fish on the table.',
  },
  Orange: {
    title: 'Skin contact',
    text: 'Tea, bitter peel, a bit of texture. Days-on-skins whites and amphora wines are your lane.',
  },
  Rosé: {
    title: 'Chillable',
    text: 'Fruit first, served cold, gone by sunset. Dry rosés and light reds you can put in the fridge.',
  },
  Sparkling: {
    title: 'Bubbles first',
    text: 'Crunchy, cloudy, a little wild. Pét-nats and sharp, low-alcohol whites to start every evening.',
  },
}
