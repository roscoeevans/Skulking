/* ============================================================
   Night Activities — Client-side activity bank
   These exist purely to mask night phase timing.
   They have zero effect on game state.
   ============================================================ */

export type ActivityType = 'trivia' | 'poll' | 'riddle' | 'reaction'

export interface NightActivity {
    id: string
    type: ActivityType
    question: string
    options: string[]
    /** Index of correct answer (trivia only, -1 for polls) */
    answer: number
    /** Seconds to answer (default 10) */
    timeLimit: number
}

// ── Activity Bank ──

const ACTIVITIES: NightActivity[] = [
    // ── TRIVIA ──
    { id: 't1', type: 'trivia', question: 'What is the tallest mountain on Earth?', options: ['K2', 'Mount Everest', 'Kangchenjunga', 'Lhotse'], answer: 1, timeLimit: 10 },
    { id: 't2', type: 'trivia', question: 'Which planet has the most moons?', options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], answer: 1, timeLimit: 10 },
    { id: 't3', type: 'trivia', question: 'What year did the Titanic sink?', options: ['1910', '1912', '1914', '1916'], answer: 1, timeLimit: 10 },
    { id: 't4', type: 'trivia', question: 'What is the smallest country in the world?', options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'], answer: 1, timeLimit: 10 },
    { id: 't5', type: 'trivia', question: 'How many bones are in the human body?', options: ['186', '196', '206', '216'], answer: 2, timeLimit: 10 },
    { id: 't6', type: 'trivia', question: 'What element does "O" represent on the periodic table?', options: ['Osmium', 'Oxygen', 'Oganesson', 'Gold'], answer: 1, timeLimit: 8 },
    { id: 't7', type: 'trivia', question: 'Which ocean is the deepest?', options: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], answer: 2, timeLimit: 10 },
    { id: 't8', type: 'trivia', question: 'Who painted the Mona Lisa?', options: ['Michelangelo', 'Raphael', 'Da Vinci', 'Botticelli'], answer: 2, timeLimit: 8 },
    { id: 't9', type: 'trivia', question: 'What is the speed of light (km/s)?', options: ['150,000', '200,000', '300,000', '400,000'], answer: 2, timeLimit: 10 },
    { id: 't10', type: 'trivia', question: 'Which country invented pizza?', options: ['Greece', 'France', 'Italy', 'Spain'], answer: 2, timeLimit: 8 },
    { id: 't11', type: 'trivia', question: 'How many hearts does an octopus have?', options: ['1', '2', '3', '4'], answer: 2, timeLimit: 10 },
    { id: 't12', type: 'trivia', question: 'What is the hardest natural substance?', options: ['Titanium', 'Diamond', 'Quartz', 'Topaz'], answer: 1, timeLimit: 8 },
    { id: 't13', type: 'trivia', question: 'Which language has the most native speakers?', options: ['English', 'Spanish', 'Mandarin', 'Hindi'], answer: 2, timeLimit: 10 },
    { id: 't14', type: 'trivia', question: 'What is the largest organ in the human body?', options: ['Liver', 'Brain', 'Skin', 'Lungs'], answer: 2, timeLimit: 10 },
    { id: 't15', type: 'trivia', question: 'In what year did humans first land on the Moon?', options: ['1967', '1968', '1969', '1970'], answer: 2, timeLimit: 8 },
    { id: 't16', type: 'trivia', question: 'What gas do plants primarily absorb?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Helium'], answer: 2, timeLimit: 8 },
    { id: 't17', type: 'trivia', question: 'Which animal can sleep for 3 years?', options: ['Sloth', 'Snail', 'Koala', 'Cat'], answer: 1, timeLimit: 10 },
    { id: 't18', type: 'trivia', question: 'What is the capital of Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'], answer: 2, timeLimit: 8 },

    // ── POLLS (no correct answer) ──
    { id: 'p1', type: 'poll', question: 'Cats or dogs?', options: ['🐱 Cats', '🐶 Dogs'], answer: -1, timeLimit: 8 },
    { id: 'p2', type: 'poll', question: 'Morning person or night owl?', options: ['🌅 Morning', '🌙 Night'], answer: -1, timeLimit: 8 },
    { id: 'p3', type: 'poll', question: 'Beach vacation or mountain retreat?', options: ['🏖️ Beach', '🏔️ Mountains'], answer: -1, timeLimit: 8 },
    { id: 'p4', type: 'poll', question: 'Superpower: flight or invisibility?', options: ['✈️ Flight', '👻 Invisibility'], answer: -1, timeLimit: 8 },
    { id: 'p5', type: 'poll', question: 'Pizza or tacos?', options: ['🍕 Pizza', '🌮 Tacos'], answer: -1, timeLimit: 8 },
    { id: 'p6', type: 'poll', question: 'Time travel: past or future?', options: ['⏪ Past', '⏩ Future'], answer: -1, timeLimit: 8 },
    { id: 'p7', type: 'poll', question: 'Rainy day or sunny day?', options: ['🌧️ Rain', '☀️ Sun'], answer: -1, timeLimit: 8 },
    { id: 'p8', type: 'poll', question: 'Sweet or savory?', options: ['🍰 Sweet', '🧀 Savory'], answer: -1, timeLimit: 8 },
    { id: 'p9', type: 'poll', question: 'Live forever or live twice?', options: ['♾️ Forever', '🔄 Twice'], answer: -1, timeLimit: 8 },
    { id: 'p10', type: 'poll', question: 'Teleportation or time stop?', options: ['🌀 Teleport', '⏸️ Time Stop'], answer: -1, timeLimit: 8 },

    // ── RIDDLES ──
    { id: 'r1', type: 'riddle', question: 'I have cities but no houses, mountains but no trees. What am I?', options: ['A globe', 'A map', 'A painting', 'A dream'], answer: 1, timeLimit: 12 },
    { id: 'r2', type: 'riddle', question: 'What has hands but can\'t clap?', options: ['A statue', 'A clock', 'A tree', 'A glove'], answer: 1, timeLimit: 12 },
    { id: 'r3', type: 'riddle', question: 'I speak without a mouth and hear without ears. What am I?', options: ['A shadow', 'An echo', 'The wind', 'A thought'], answer: 1, timeLimit: 12 },
    { id: 'r4', type: 'riddle', question: 'The more you take, the more you leave behind. What am I?', options: ['Memories', 'Breaths', 'Footsteps', 'Photos'], answer: 2, timeLimit: 12 },
    { id: 'r5', type: 'riddle', question: 'What can travel around the world while staying in a corner?', options: ['A spider', 'A stamp', 'Wi-Fi', 'A shadow'], answer: 1, timeLimit: 12 },
    { id: 'r6', type: 'riddle', question: 'What has a head and a tail but no body?', options: ['A snake', 'A coin', 'A comet', 'A pin'], answer: 1, timeLimit: 12 },
    { id: 'r7', type: 'riddle', question: 'What gets wetter the more it dries?', options: ['A sponge', 'A towel', 'The sun', 'Sand'], answer: 1, timeLimit: 12 },
    { id: 'r8', type: 'riddle', question: 'What has keys but no locks?', options: ['A keyboard', 'A piano', 'A map', 'Both A & B'], answer: 3, timeLimit: 12 },
    { id: 'r9', type: 'riddle', question: 'What can you catch but not throw?', options: ['A ball', 'A cold', 'A fish', 'A wave'], answer: 1, timeLimit: 12 },
    { id: 'r10', type: 'riddle', question: 'I have teeth but cannot bite. What am I?', options: ['A saw', 'A comb', 'A zipper', 'A gear'], answer: 1, timeLimit: 12 },

    // ── REACTION (tap-speed guessing) ──
    { id: 'x1', type: 'reaction', question: 'Quick! What\'s 7 × 8?', options: ['48', '54', '56', '64'], answer: 2, timeLimit: 5 },
    { id: 'x2', type: 'reaction', question: 'Quick! Capital of Japan?', options: ['Seoul', 'Beijing', 'Tokyo', 'Osaka'], answer: 2, timeLimit: 5 },
    { id: 'x3', type: 'reaction', question: 'Quick! How many sides on a hexagon?', options: ['5', '6', '7', '8'], answer: 1, timeLimit: 5 },
    { id: 'x4', type: 'reaction', question: 'Quick! What color do you get mixing red and blue?', options: ['Green', 'Orange', 'Purple', 'Brown'], answer: 2, timeLimit: 5 },
    { id: 'x5', type: 'reaction', question: 'Quick! Largest continent?', options: ['Africa', 'Asia', 'Europe', 'N. America'], answer: 1, timeLimit: 5 },
    { id: 'x6', type: 'reaction', question: 'Quick! 144 ÷ 12?', options: ['10', '11', '12', '13'], answer: 2, timeLimit: 5 },
    { id: 'x7', type: 'reaction', question: 'Quick! How many strings on a standard guitar?', options: ['4', '5', '6', '7'], answer: 2, timeLimit: 5 },
    { id: 'x8', type: 'reaction', question: 'Quick! What\'s the chemical formula for water?', options: ['CO2', 'H2O', 'NaCl', 'O2'], answer: 1, timeLimit: 5 },
]

// ── Shuffle Utility (Fisher-Yates) ──

export function shuffleActivities(): NightActivity[] {
    const arr = [...ACTIVITIES]
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
}

/** Total activities in the bank */
export const ACTIVITY_COUNT = ACTIVITIES.length
