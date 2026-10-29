/* Offline branching tale: "The Hollow Crown".
   Hand-authored so the studio works with no network, mirrors the branching-narrative tradition the
   dissertation discusses (Twine / Choice of Games) and acts as the fallback for the live model. */
(function (global) {
  'use strict';

  const N = {
    start: {
      biome: 'forest', time: 'dusk', mood: 'curious',
      text: 'Dusk gathers like spilled ink in the Whispering Wood. {hero}, {article} {role}, stands where the trade road dies into roots and moss, a crumpled map in one hand. Three kingdoms have lost their sleep since the Hollow Crown vanished, and the only rumour worth chasing says it was carried here. Between the trunks, pale silver lights drift without a breeze, and far above, a lightning-scarred oak rises over the canopy.',
      state: { places: ['The Whispering Wood'], quest: 'Find the vanished Hollow Crown', items: ['A crumpled map'] },
      choices: [['Follow the drifting silver lights', 'glade'], ['Take the moss-choked old road toward smoke on the horizon', 'village'], ['Climb the lightning-scarred oak to scout the land', 'oak']]
    },
    glade: {
      biome: 'forest', time: 'night', mood: 'mysterious',
      text: 'The lights lead {hero} into a moonlit glade where the air hums like a plucked string. A fox with eyes of pale amber sits on a toppled standing stone, and then it is not a fox at all, but Maelis, a spirit of the wood draped in a coat of fireflies. "The Crown is hollow," she purrs, "and hollow things must be filled. Answer me true: what does a crown weigh?"',
      state: { characters: [['Maelis', 'fox-eyed wood spirit who speaks in riddles']], places: ['The Moonlit Glade'] },
      choices: [['Answer honestly: "More than any gold can carry"', 'ruins'], ['Bargain with her for a charm instead of answering', 'bargain'], ['Refuse the riddle and press on toward the smoke', 'village']]
    },
    oak: {
      biome: 'mountain', time: 'dawn', mood: 'hopeful',
      text: 'Bark splinters under {hero}\'s grip as the climb ends in a rush of cold wind. From the crown of the oak the land unfolds: a black tower of Emberwatch keep clawing at the clouds to the north, the tilted pillars of an old shrine glowing faintly to the east, and, over the far peaks, a slow thread of smoke that is not the smoke of any hearth. A dropped spyglass wedged in the branches is yours for the taking.',
      state: { places: ['Emberwatch Keep (distant)', 'The Shrine of Pillars (distant)'], items: ['A brass spyglass'] },
      choices: [['Head for Emberwatch keep', 'castle'], ['Make for the glowing shrine', 'ruins'], ['Climb down and follow the silver lights', 'glade']]
    },
    village: {
      biome: 'village', time: 'dusk', mood: 'warm',
      text: 'Emberhollow is a handful of crooked roofs hugging a single lantern-lit inn. Behind the bar of The Gilded Lantern, a broad innkeeper named Bron polishes a tankard and eyes {hero}\'s {role} gear. "Crown-hunters," he sighs. "You are the fifth this moon. The Warden of Emberwatch swears it was stolen, but the old folk say it was never stolen at all. It was hidden. Ask the lake, ask the shrine, or ask the Warden, if you like your questions answered with chains."',
      state: { characters: [['Bron', 'weary innkeeper of The Gilded Lantern']], places: ['Emberhollow', 'The Gilded Lantern'], items: ['A warm lantern'] },
      choices: [['Ask Bron to name the Warden\'s secrets', 'castle'], ['Take the ferry across Mirror Lake', 'sea'], ['Slip out before dawn toward the shrine', 'ruins']]
    },
    bargain: {
      biome: 'forest', time: 'night', mood: 'uneasy',
      text: '"A bargain, then," Maelis grins, and her tail splits into three. She plucks a single firefly from her coat and presses it into {hero}\'s palm, where it cools into a charm of glass and flame. "Fox-fire. It will burn only when a lie is spoken near you. The price is small: a memory of your first home, taken just so." The charm warms against your skin. Somewhere, a name you loved loses its edges.',
      state: { items: ['Fox-fire charm (burns near lies)'], characters: [['Maelis', 'bargained a charm for a childhood memory']] },
      choices: [['Carry the charm to the ancient shrine', 'ruins'], ['Show the charm to the folk of Emberhollow', 'village']]
    },
    sea: {
      biome: 'sea', time: 'dawn', mood: 'serene',
      text: 'Mirror Lake is so still that the sky appears twice. The ferryman poles in silence while pale mist coils over the water, and halfway across {hero} notices what lies beneath: a drowned road, a drowned gate, a drowned city of white stone, and in its centre a throne that seems to watch back. "Folk say the Crown\'s first king sleeps down there," the ferryman murmurs, and sets you ashore beside the broken pillars of the old shrine.',
      state: { places: ['Mirror Lake', 'The Drowned City'] },
      choices: [['Walk into the shrine', 'ruins'], ['Search the shoreline caves', 'cave']]
    },
    ruins: {
      biome: 'ruins', time: 'night', mood: 'tense',
      text: 'The Shrine of Pillars stands open to the stars, its runes crawling with cold blue light. At the altar rests an empty cushion shaped exactly like a crown. As {hero} steps closer, the great stone knight at the altar groans awake, moss cracking from its shoulders. "Who comes to the Hollow Throne?" it rumbles. "Speak a true name, or be sealed in stone." Beneath the altar, a stair spirals down toward a faint orange glow.',
      state: { characters: [['The Stone Warden', 'ancient guardian of the shrine']], places: ['The Shrine of Pillars'], quest: 'Pass the Stone Warden and follow the stair' },
      choices: [['Speak your true name and your purpose', 'cave'], ['Fight the guardian with all you have', 'cave_fight'], ['Sneak around the guardian toward the stair', 'cave']]
    },
    cave_fight: {
      biome: 'ruins', time: 'storm', mood: 'fierce',
      text: 'Steel rings against stone and sparks scatter like startled birds. The Stone Warden is slow but each blow shakes the pillars; {hero} dodges, strikes, and finds the glowing rune at its chest. One precise blow, and the great knight folds into a heap of mossy rubble with a sigh that sounds almost like relief. "At last," its voice whispers from the dust, "someone brave enough to need the truth." The stair below is open.',
      state: { characters: [['The Stone Warden', 'defeated, but grateful']] },
      choices: [['Descend the stair', 'cave']]
    },
    castle: {
      biome: 'castle', time: 'dusk', mood: 'dread',
      text: 'Emberwatch keep drinks the last light. Warden Corvane receives {hero} in a hall of black glass, a tall woman with a gaunt smile and a ring of keys at her belt. "You search for the Crown. So did I. It would restore the kingdom, if the right hand wore it." She slides a sealed writ across the table. "Take my offer: bring it to me, and the three kingdoms will call you hero. Refuse, and the dungeons are warm this season."',
      state: { characters: [['Warden Corvane', 'gaunt ruler of Emberwatch, hungry for the Crown']], places: ['Emberwatch Keep'], items: ['The Warden\'s sealed writ'] },
      choices: [['Confront her about the lies you were told', 'dragon'], ['Accept the deal and swear the oath', 'ending_dark'], ['Slip into the vaults beneath the keep', 'cave']]
    },
    cave: {
      biome: 'cave', time: 'night', mood: 'awe',
      text: 'The tunnel opens into a cavern of living crystal, every facet humming a different note. {hero} walks through a cathedral of blue and violet light until the floor rises into a hoard of cold gold, and on it, resting on a bone-pale cushion, sits the Hollow Crown, a ring of dark silver with a hollow where a jewel should be. The hoard shifts. A great amber eye opens in the dark, and the crystals fall silent.',
      state: { characters: [['Ashkarel', 'ancient dragon, keeper of the Crown']], places: ['The Crystal Cavern'], quest: 'Decide the fate of the Hollow Crown', items: ['Sight of the Hollow Crown'] },
      choices: [['Speak to the dragon and ask what the Crown is', 'dragon'], ['Snatch the Crown and run', 'ending_flee']]
    },
    dragon: {
      biome: 'dragon', time: 'dusk', mood: 'solemn',
      text: 'Ashkarel uncoils slowly, vast and patient, scales like banked embers. "I did not steal the Crown, little one. I was given it, to guard it from those who would wear it." The dragon\'s voice settles into the stone. "It is hollow because it holds nothing but the memory of every kingdom that ever trusted a ruler. Wear it, and you hold their trust. Break it, and the kingdoms must learn to trust one another. Return it, and the old oaths remain. Choose as {hero} would."',
      state: { characters: [['Ashkarel', 'ancient dragon who guarded, not stole, the Crown']], quest: 'Choose: return, keep or break the Crown' },
      choices: [['Return the Crown to the three kingdoms', 'ending_light'], ['Claim the Crown for yourself', 'ending_dark'], ['Shatter the Crown and free its memory', 'ending_free']]
    },
    ending_light: {
      biome: 'castle', time: 'dawn', mood: 'triumphant', ending: true,
      text: 'At dawn {hero} lays the Hollow Crown before the three thrones, and the kingdoms, startled out of their grief, remember how to sit at one table. Bells ring in Emberhollow. Bron hangs a lantern in the window that never goes out, and Maelis the fox-spirit watches from the rooftops, grinning. The tale of {hero}, {article} {role}, is sung for a hundred years: not the story of a theft, but of a trust returned. THE END.',
      state: { quest: 'Completed: the Crown returned' }, choices: []
    },
    ending_dark: {
      biome: 'castle', time: 'storm', mood: 'ominous', ending: true,
      text: 'The Crown settles on {hero}\'s brow and every voice of every kingdom floods in at once: hopes, grudges, prayers. It is a splendid, terrible weight. By winter the keep is yours, the Warden is a memory, and the people bow with eyes that never quite meet your own. You rule well, they say, and no one dares to say otherwise. Somewhere far below, a dragon sighs. THE END.',
      state: { quest: 'Ended: a crown too heavy to put down' }, choices: []
    },
    ending_free: {
      biome: 'mountain', time: 'dawn', mood: 'bittersweet', ending: true,
      text: 'The Hollow Crown breaks with a sound like a thousand doors opening. Light pours out, not gold but a drifting snow of small, bright memories, settling on every roof from the lake to the mountains. Kings wake weeping and peasants wake laughing. There will be no crown now; the kingdoms will have to talk, and quarrel, and learn. {hero} watches the first dawn of the new age from the highest ridge, and Ashkarel\'s shadow crosses the sun. THE END.',
      state: { quest: 'Completed: the Crown shattered, the memory freed' }, choices: []
    },
    ending_flee: {
      biome: 'forest', time: 'night', mood: 'frantic', ending: true,
      text: '{hero} snatches the Crown and runs, and the cavern roars. Crystals shatter behind you in a rain of colored glass. You burst into the Whispering Wood with the Crown screaming against your ribs, and every silver light in the forest turns to face you. You may have won it, but the wood now knows your name, and so does something much older, much patient, and not at all forgiving. THE END?',
      state: { quest: 'Pursued: the Crown taken in haste' }, choices: []
    }
  };

  const IMPROV = {
    forest: ['Leaves whisper as if the wood itself is weighing your intent.', 'A distant owl falls silent, then calls once, as if in approval.'],
    village: ['A shutter creaks open across the lane, someone is watching.', 'The smell of woodsmoke and baked bread follows you.'],
    ruins: ['Runes flare blue for a heartbeat, then dim, as if reading you.', 'Dust falls from the pillars in a slow, listening hush.'],
    castle: ['A banner snaps overhead; guards exchange a glance you pretend not to see.', 'Torches gutter though no wind blows.'],
    cave: ['Crystals chime softly, passing your intent down the tunnel.', 'The dark ahead seems to lean closer, curious.'],
    sea: ['The mirror-still water ripples once in a perfect ring.', 'Mist curls around your boots like a cat.'],
    dragon: ['The dragon\'s great eye narrows, amused, and does not look away.', 'Heat shimmers off the hoard in slow waves.'],
    mountain: ['A thin wind carries the scent of snow and iron.', 'High above, a hawk wheels once, then vanishes.'],
    desert: ['Sand whispers across your boots.', 'The horizon bends in the heat.'],
    swamp: ['A bubble breaks in the mire, releasing a pale green glow.', 'Something unseen plops into the dark water.']
  };

  global.Tales = { nodes: N, improv: IMPROV, startId: 'start' };
})(window);
