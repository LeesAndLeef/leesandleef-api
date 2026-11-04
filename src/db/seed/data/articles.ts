const amphoraeCellar = '/assets/cellar/amphorae.svg'
const oliveTreesNetsLandscape = '/assets/landscapes/olive-trees-nets.svg'
const vinesRedSoilLandscape = '/assets/landscapes/vines-red-soil.svg'
const manGlassesOlivePortrait = '/assets/portraits/man-glasses-olive.svg'
const womanBobGlassesPortrait = '/assets/portraits/woman-bob-glasses.svg'
const womanCurlyHairWinePortrait = '/assets/portraits/woman-curly-hair-wine.svg'

import type { Article } from '../../../types/content.ts'

export const articles: Article[] = [
  {
    slug: 'terroir',
    no: 12,
    tag: 'Terroir',
    read: '8 min read',
    title: 'Why Istrian red soil makes wine taste of iron',
    lede: 'A geologist, a grower and a very old map walk into a vineyard. What terra rossa does to Teran — and what it doesn’t.',
    dek: 'Teran from terra rossa is often described as ferrous, even bloody. We asked a grower, read the geology and opened a lot of bottles to find out where that taste really comes from.',
    img: vinesRedSoilLandscape,
    alt: 'Illustration: vine rows above layers of red terra rossa soil',
    caption: 'Crvena zemlja — the red earth below Motovun',
    pattern: 'hatch',
    author: 'Lea Matić',
    authorImg: womanBobGlassesPortrait,
    date: '14 October 2026',
    toc: [
      { id: 't1', title: 'What terra rossa is' },
      { id: 't2', title: 'What it does to the vine' },
      { id: 't3', title: 'So — is it iron?' },
      { id: 't4', title: 'Red, grey, white' },
      { id: 't5', title: 'Taste it yourself' },
    ],
    short: [
      'Terra rossa is red clay left behind as limestone dissolves; iron oxides give the colour.',
      'It drains fast, so vines work harder and grow smaller, thicker-skinned berries.',
      'The “iron” note is mostly acidity and aroma — not iron from the soil.',
    ],
    productsTitle: 'Wines from the red soil',
    products: [
      { id: 'teran-crvena-zemlja', note: 'Red · Terra rossa' },
      { id: 'malvazija-bijela', note: 'White · White marl' },
      { id: 'muskat-zlatna', note: 'White · Grey flysch' },
    ],
  },
  {
    slug: 'skin-contact',
    no: 11,
    tag: 'Technique',
    read: '6 min read',
    title: 'Skin contact, explained without the jargon',
    lede: 'Orange wine is white wine made like red. Here’s what days on skins really change in the glass.',
    dek: 'Orange wine isn’t made from oranges, and it isn’t a fad. It’s white wine made the way red wine always has been — and the skins change almost everything in the glass.',
    img: amphoraeCellar,
    alt: 'Illustration: clay amphorae half-buried in a stone cellar',
    caption: 'Clay, skins and patience',
    pattern: 'hatch-w',
    author: 'Ivan Perić',
    authorImg: womanCurlyHairWinePortrait,
    date: '16 September 2026',
    toc: [
      { id: 's1', title: 'White wine, made like red' },
      { id: 's2', title: 'What the skins add' },
      { id: 's3', title: 'How long is long?' },
      { id: 's4', title: 'Clay, wood or steel' },
      { id: 's5', title: 'Serving and food' },
    ],
    short: [
      '‘Orange’, ‘amber’ and ‘skin-contact’ wine mean the same thing: white grapes fermented on their skins.',
      'Skins add colour, tannin and texture — from a few hours to many months.',
      'Serve it cooler than red, warmer than white, with food.',
    ],
    productsTitle: 'Wines from this story',
    products: [
      { id: 'malvazija-sedam-dana', note: 'Orange · 7 days on skins' },
      { id: 'malvazija-amfora', note: 'Orange · 6 months in clay' },
      { id: 'posip-kamen', note: 'White · for comparison' },
    ],
  },
  {
    slug: 'olive-oil',
    no: 10,
    tag: 'Olive oil',
    read: '5 min read',
    title: 'How to read an olive oil label (and spot a bad one)',
    lede: 'Harvest date, cultivar, polyphenols: three lines that tell you more than “extra virgin” ever will.',
    dek: '“Extra virgin” on the front tells you surprisingly little. Turn the bottle around: harvest date, cultivar and a couple of lab numbers say far more about what’s inside.',
    img: oliveTreesNetsLandscape,
    alt: 'Illustration: olive trees with harvest nets spread underneath',
    caption: 'November in the grove',
    pattern: 'hatch',
    author: 'Nina Vuković',
    authorImg: manGlassesOlivePortrait,
    date: '19 August 2026',
    toc: [
      { id: 'o1', title: 'Harvest date first' },
      { id: 'o2', title: 'Cultivar and origin' },
      { id: 'o3', title: 'The two numbers that matter' },
      { id: 'o4', title: 'Bottle and storage' },
      { id: 'o5', title: 'Red flags' },
    ],
    short: [
      'Look for a harvest date and use the oil within about a year of it.',
      'Free acidity well under the 0.8% legal limit and high polyphenols signal care.',
      'Bitterness and a peppery throat are good signs, not faults.',
    ],
    productsTitle: 'Oils from this story',
    products: [
      { id: 'buza-grove-14', note: 'Olive oil · grassy, almond' },
      { id: 'istarska-bjelica', note: 'Olive oil · bitter, peppery' },
      { id: 'oblica-island-blend', note: 'Olive oil · soft, buttery' },
    ],
  },
]
