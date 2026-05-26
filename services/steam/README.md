# skinshi-steam

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.11. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

// CASES
// All CS2 weapon cases - verified classids from Steam Market API
export const CS2_CASES: CaseDefinition[] = [
// Current drop pool cases
{ classId: "5710094579", name: "Kilowatt Case" },
{ classId: "6918191812", name: "Fever Case" },
{ classId: "6210138906", name: "Gallery Case" },
{ classId: "5189384637", name: "Revolution Case" },
{ classId: "4901046679", name: "Recoil Case" },
{ classId: "4717330486", name: "Dreams & Nightmares Case" },

// Older cases (still tradable)
{ classId: "4578724859", name: "Operation Riptide Case" },
{ classId: "4418618853", name: "Snakebite Case" },
{ classId: "4114525951", name: "Operation Broken Fang Case" },
{ classId: "3946324730", name: "Fracture Case" },
{ classId: "3761545285", name: "Prisma 2 Case" },
{ classId: "3600645128", name: "Shattered Web Case" },
{ classId: "3564864937", name: "CS20 Case" },
{ classId: "3213411179", name: "Prisma Case" },
{ classId: "3106076656", name: "Danger Zone Case" },
{ classId: "2948874694", name: "Horizon Case" },
{ classId: "2727227113", name: "Clutch Case" },
{ classId: "2521767801", name: "Spectrum 2 Case" },
{ classId: "2209581061", name: "Spectrum Case" },
{ classId: "2066632015", name: "Glove Case" },
{ classId: "1923037342", name: "Gamma 2 Case" },
{ classId: "1797256701", name: "Gamma Case" },
{ classId: "1690096482", name: "Chroma 3 Case" },
{ classId: "1544067968", name: "Operation Wildfire Case" },
{ classId: "1432174707", name: "Revolver Case" },
{ classId: "1293508920", name: "Shadow Case" },
{ classId: "991959905", name: "Falchion Case" },
{ classId: "926978479", name: "Chroma 2 Case" },
{ classId: "720268538", name: "Chroma Case" },
{ classId: "638240019", name: "Operation Vanguard Weapon Case" },
{ classId: "520025252", name: "Operation Breakout Weapon Case" },
{ classId: "469431148", name: "Huntsman Weapon Case" },
{ classId: "384801319", name: "Operation Phoenix Weapon Case" },

// Legacy cases
{ classId: "384801297", name: "CS:GO Weapon Case" },
{ classId: "166036698", name: "CS:GO Weapon Case 2" },
{ classId: "310779297", name: "CS:GO Weapon Case 3" },
{ classId: "166045274", name: "eSports 2013 Case" },
{ classId: "166045266", name: "eSports 2013 Winter Case" },
{ classId: "384801322", name: "eSports 2014 Summer Case" },
{ classId: "166048142", name: "Winter Offensive Weapon Case" },
{ classId: "384801312", name: "Operation Bravo Case" },
{ classId: "1058191236", name: "Operation Hydra Case" },

// New CS2 Armory Terminals
{ classId: "7488632023", name: "Sealed Genesis Terminal" },
{ classId: "8246873714", name: "Sealed Dead Hand Terminal" }
];
