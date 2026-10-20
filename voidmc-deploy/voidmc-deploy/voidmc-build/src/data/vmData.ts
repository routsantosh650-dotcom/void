/**
 * VOIDMC content model + the shipped defaults.
 *
 * Every collection below can be edited live from the studio console (Firestore). These objects are
 * what the site renders before a collection has any documents, so a fresh deployment is never
 * blank — and a Firestore rules mistake is never fatal.
 */

export interface ModeDoc {
  id: string;
  title: string;
  tagline: string;
  summary: string;
  tags: string[];
  players: string;
  accent: string;
  sortOrder: number;
  active: boolean;
}

export interface RuleDoc {
  id: string;
  title: string;
  text: string;
  severity: 'hard' | 'warn';
  sortOrder: number;
  active: boolean;
}

export interface StaffDoc {
  id: string;
  name: string;
  role: string;
  since: string;
  bio: string;
  perms: string[];
  sortOrder: number;
  active: boolean;
}

export interface EventDoc {
  id: string;
  title: string;
  summary: string;
  kind: string;
  /** ISO datetime the event starts — the countdown board reads the next future one. */
  startsAt: string;
  reward: string;
  sortOrder: number;
  active: boolean;
}

export interface BuildDoc {
  id: string;
  title: string;
  author: string;
  category: 'spawn' | 'community' | 'nether' | 'end' | 'farm';
  summary: string;
  tags: string[];
  year: number;
  featured: boolean;
  sortOrder: number;
  active: boolean;
}

export interface FaqDoc {
  id: string;
  q: string;
  a: string;
  sortOrder: number;
  active: boolean;
}

export interface SiteConfigData {
  brandName: string;
  tagline: string;
  heroLine: string;
  serverIp: string;
  bedrockPort: string;
  javaVersion: string;
  discordUrl: string;
  youtubeUrl: string;
  announcement: string;
  playerCap: string;
  statusNote: string;
}

export const DEFAULT_CONFIG: SiteConfigData = {
  brandName: 'VOIDMC',
  tagline: 'Enter The Void',
  heroLine:
    'A hand-run Minecraft SMP. Custom modes, weekly events, staff who actually show up — and a world that keeps whatever you build in it.',
  serverIp: '',
  bedrockPort: '',
  javaVersion: '1.21.x',
  discordUrl: 'https://discord.gg/K69Kx8y9Z',
  youtubeUrl: 'https://youtube.com/@voidsmp-r7i',
  announcement: 'New season is live — fresh world map, reset ranks, double XP all week.',
  playerCap: '60',
  statusNote: 'Java + Bedrock · whitelist free · no pay-to-win',
};

export const DEFAULT_MODES: ModeDoc[] = [
  {
    id: 'voidsmp',
    title: 'VoidSMP',
    tagline: 'The main world',
    summary:
      'Long-run survival with land claims, an economy that players actually control, and seasonal events that change the map instead of resetting it.',
    tags: ['Survival', 'Claims', 'Economy', 'Seasonal'],
    players: 'Season 4',
    accent: '#A855F7',
    sortOrder: 1,
    active: true,
  },
  {
    id: 'skyblock',
    title: 'SkyBlock',
    tagline: 'One island. Zero excuses.',
    summary:
      'Start on a floating slab with nothing but a tree and a plan. Level your island, unlock generators, and race the leaderboard for the top spot.',
    tags: ['Islands', 'Levels', 'Leaderboard', 'Co-op'],
    players: 'Competitive',
    accent: '#C084FC',
    sortOrder: 2,
    active: true,
  },
  {
    id: 'lifesteal',
    title: 'Lifesteal',
    tagline: 'Kill to steal hearts',
    summary:
      'Ten hearts, and every kill takes one from somebody else. Lose them all and you get banished until a teammate resurrects you. Pure chaos, pure strategy.',
    tags: ['PvP', 'Hearts', 'Teams', 'Banish'],
    players: 'Hardcore',
    accent: '#F43F5E',
    sortOrder: 3,
    active: true,
  },
  {
    id: 'plots',
    title: 'Creative Plots',
    tagline: 'WorldEdit + no limits',
    summary:
      'Free plots with WorldEdit, schematic loading and a build wall the whole community walks through. Practise the stuff you want to place in survival.',
    tags: ['Creative', 'WorldEdit', 'Plots', 'Build wall'],
    players: 'Open',
    accent: '#38BDF8',
    sortOrder: 4,
    active: true,
  },
  {
    id: 'minigames',
    title: 'Minigames',
    tagline: 'Drop in, wreck the lobby',
    summary:
      'Bedwars, TNT run, parkour and Spleef rotate through the lobby, with custom maps and a weekend tournament every Saturday night.',
    tags: ['Bedwars', 'Parkour', 'TNT', 'Tournaments'],
    players: 'Weekends',
    accent: '#FBBF24',
    sortOrder: 5,
    active: true,
  },
];

export const DEFAULT_RULES: RuleDoc[] = [
  {
    id: 'r1',
    title: 'No cheating clients',
    text: 'X-ray, kill aura, reach, auto-clickers, fly and macros are all bannable — on any mode, including creative plots. Replay checks are run on reports.',
    severity: 'hard',
    sortOrder: 1,
    active: true,
  },
  {
    id: 'r2',
    title: 'Do not grief or steal',
    text: 'Anything inside another player’s claim, or a base you were not invited to, is off limits. Building in someone’s view distance without asking counts too.',
    severity: 'hard',
    sortOrder: 2,
    active: true,
  },
  {
    id: 'r3',
    title: 'Lag machines and chunk bombs are banned',
    text: 'Redstone or entity farms designed to hurt the server, not just your neighbours, get removed and the owner muted first, banned second.',
    severity: 'hard',
    sortOrder: 3,
    active: true,
  },
  {
    id: 'r4',
    title: 'Alts are fine, evading is not',
    text: 'You can have a second account for building. Using one to bypass a mute, ban or claim limit ends both of them.',
    severity: 'hard',
    sortOrder: 4,
    active: true,
  },
  {
    id: 'r5',
    title: 'Keep chat livable',
    text: 'No hate speech, no sexual content involving minors, no doxxing, no spam. Bigmod arguments belong in a DM, not in global chat.',
    severity: 'hard',
    sortOrder: 5,
    active: true,
  },
  {
    id: 'r6',
    title: 'No real-money trades',
    text: 'Items, ranks and accounts stay inside the server. Paying someone outside for in-game stuff is not protected and usually ends in a loss.',
    severity: 'hard',
    sortOrder: 6,
    active: true,
  },
  {
    id: 'r7',
    title: 'Build at your own risk',
    text: 'We do not keep backups of individual bases. Take screenshots, share the load with a friend, and store anything irreplaceable in an ender chest.',
    severity: 'warn',
    sortOrder: 7,
    active: true,
  },
  {
    id: 'r8',
    title: 'Report with proof',
    text: 'A clip or a replay says more than an accusation. Post it in the reports channel on Discord and a staff member will look at it.',
    severity: 'warn',
    sortOrder: 8,
    active: true,
  },
];

export const DEFAULT_STAFF: StaffDoc[] = [
  {
    id: 's-owner',
    name: 'ANSH',
    role: 'Owner',
    since: 'Season 1',
    bio: 'Started the server, still approves every plugin addition himself.',
    perms: ['Everything'],
    sortOrder: 1,
    active: true,
  },
  {
    id: 's-admin',
    name: 'SYLUX',
    role: 'Head Admin',
    since: 'Season 1',
    bio: 'Runs the staff team, handles appeals and keeps the map backups honest.',
    perms: ['Bans', 'Rollbacks', 'Appeals'],
    sortOrder: 2,
    active: true,
  },
  {
    id: 's-mod',
    name: 'EMPEROR',
    role: 'Moderator',
    since: 'Season 3',
    bio: 'Chat, reports and replay checks. Fastest responder on the team.',
    perms: ['Mutes', 'Reports'],
    sortOrder: 3,
    active: true,
  },
  {
    id: 's-builder',
    name: 'SAM',
    role: 'Build Lead',
    since: 'Season 2',
    bio: 'Spawn, the nether hub and every event arena. Ask before you copy the style.',
    perms: ['Spawn', 'Events'],
    sortOrder: 4,
    active: true,
  },
];

export const DEFAULT_EVENTS: EventDoc[] = [
  {
    id: 'e-contest',
    title: 'Weekly Build Battle',
    summary: 'Theme drops on Discord every Friday. Two hours on a shared plot line, then the community votes.',
    kind: 'Build',
    startsAt: '',
    reward: 'Rank upgrade + 25k in-game',
    sortOrder: 1,
    active: true,
  },
  {
    id: 'e-boss',
    title: 'Void Boss Night',
    summary: 'A custom boss spawns at world spawn with the whole server invited. Loot scales with how many show up.',
    kind: 'PvE',
    startsAt: '',
    reward: 'Custom gear drops',
    sortOrder: 2,
    active: true,
  },
  {
    id: 'e-drop',
    title: 'Drop Party',
    summary: 'Staff throw loot into the arena pit. Whoever survives the crowd keeps what they grab.',
    kind: 'PvP',
    startsAt: '',
    reward: 'Whatever you can carry',
    sortOrder: 3,
    active: true,
  },
  {
    id: 'e-tourneys',
    title: 'Saturday Minigame Cup',
    summary: 'Bedwars bracket in the lobby world. Sign up in voice chat ten minutes before the bracket locks.',
    kind: 'Tournament',
    startsAt: '',
    reward: 'Leaderboard pin + kit',
    sortOrder: 4,
    active: true,
  },
];

export const DEFAULT_BUILDS: BuildDoc[] = [
  {
    id: 'b-spawn',
    title: 'Void Spawn',
    author: 'SAM',
    category: 'spawn',
    summary: 'The obsidian island every player arrives on, with the portal hall, shop street and the wall of seasons past.',
    tags: ['Spawn', 'Builds'],
    year: 2026,
    featured: true,
    sortOrder: 1,
    active: true,
  },
  {
    id: 'b-nether',
    title: 'Nether Hub',
    author: 'Community',
    category: 'nether',
    summary: 'Every portal in the server linked through one fortress station, so no one has to build their own tunnel again.',
    tags: ['Nether', 'Transport'],
    year: 2026,
    featured: true,
    sortOrder: 2,
    active: true,
  },
  {
    id: 'b-city',
    title: 'Player City',
    author: '22 builders',
    category: 'community',
    summary: 'A claimed-plot town that grew into a proper city with a market, a rail line and one very controversial tower.',
    tags: ['Survival', 'Town'],
    year: 2025,
    featured: false,
    sortOrder: 3,
    active: true,
  },
  {
    id: 'b-end',
    title: 'End Gateway',
    author: 'SYLUX',
    category: 'end',
    summary: 'A safe station on the main island, with crystal-free tunnels out to every exit portal.',
    tags: ['End', 'QoL'],
    year: 2025,
    featured: false,
    sortOrder: 4,
    active: true,
  },
  {
    id: 'b-farms',
    title: 'Industrial District',
    author: 'Community',
    category: 'farm',
    summary: 'Half a hundred public farms — iron, gold, raid, villager trading hall — all chunk-sensible and all open to everyone.',
    tags: ['Farms', 'Redstone'],
    year: 2026,
    featured: false,
    sortOrder: 5,
    active: true,
  },
];

export const DEFAULT_FAQ: FaqDoc[] = [
  {
    id: 'f-join',
    q: 'How do I actually join?',
    a: 'Add the server IP in Minecraft Java (version shown on the Join card), then post /join in Discord if the world is full. There is no whitelist and no application form — you are in.',
    sortOrder: 1,
    active: true,
  },
  {
    id: 'f-bedrock',
    q: 'Is Bedrock supported?',
    a: 'Yes. Same world, same inventory. Use the Bedrock port listed on the Join card with your device set to the server address.',
    sortOrder: 2,
    active: true,
  },
  {
    id: 'f-cost',
    q: 'Does it cost anything?',
    a: 'No. The server runs on donations and a cosmetic shop. Nothing you can buy gives a gameplay advantage — ranks are prefixes, colours and extra homes.',
    sortOrder: 3,
    active: true,
  },
  {
    id: 'f-grief',
    q: 'What happens if someone griefs me?',
    a: 'Report it with a clip. Rollbacks are done with CoreProtect, so we can restore a base to any point in the last few weeks and ban the person who took it.',
    sortOrder: 4,
    active: true,
  },
  {
    id: 'f-staff',
    q: 'How do I become staff?',
    a: 'Applications open in Discord when there is a slot. We look for people who already answer questions, not people who ask for the job.',
    sortOrder: 5,
    active: true,
  },
  {
    id: 'f-map',
    q: 'How often do you reset?',
    a: 'One season at a time, roughly every four to six months, with the map published before the reset so builders can archive their work.',
    sortOrder: 6,
    active: true,
  },
];

/** Categories the build gallery filters by, in the order the chips appear. */
export const BUILD_CATEGORIES: Array<{ id: BuildDoc['category']; label: string }> = [
  { id: 'spawn', label: 'Spawn' },
  { id: 'community', label: 'Community' },
  { id: 'nether', label: 'Nether' },
  { id: 'end', label: 'End' },
  { id: 'farm', label: 'Farms' },
];
