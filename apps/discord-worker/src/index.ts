import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Client, GatewayIntentBits, Message, Partials, TextChannel } from "discord.js";

type WorldConfig = {
  id: string;
  name: string;
  channelId: string;
  description: string;
};

type StoredMessage = {
  id: string;
  worldId: string;
  channelId: string;
  author: string;
  content: string;
  createdAt: string;
  source: "discord" | "minecraft";
};

type PlayerStatus = {
  name: string;
  online: boolean;
  worldId: string;
  lastSeenAt: string;
  lastEvent: "joined" | "left" | "death" | "chat" | "unknown";
};

type StoredEvent = {
  id: string;
  worldId: string;
  type: "server" | "join" | "leave" | "death" | "chat";
  player?: string;
  summary: string;
  createdAt: string;
};

type Store = {
  version: 1;
  worlds: WorldConfig[];
  messages: StoredMessage[];
  players: PlayerStatus[];
  events: StoredEvent[];
  updatedAt: string;
};

const token = process.env.DISCORD_BOT_TOKEN;
const worlds = parseWorlds();
const storePath = resolve(process.cwd(), process.env.MVMP_STORE_PATH ?? "data/mvmp-store.json");
const publicOutputDir = resolve(
  process.cwd(),
  process.env.MVMP_PUBLIC_OUTPUT_DIR ?? "../discord-web/public/data"
);

if (!token) {
  throw new Error("DISCORD_BOT_TOKEN is required.");
}

if (worlds.length === 0) {
  throw new Error("Configure DISCORD_CHANNEL_ID or MVMP_WORLDS.");
}

const requiredToken = token;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.once("ready", async () => {
  console.log(`Logged in as ${client.user?.tag ?? "MVMP bot"}`);
  const store = await loadStore();
  await syncAllWorlds(store);
  await saveAndExport(store);
});

client.on("messageCreate", async (message) => {
  const world = worlds.find((candidate) => candidate.channelId === message.channelId);
  if (!world) {
    return;
  }

  const store = await loadStore();
  ingestMessage(store, world, message);
  await saveAndExport(store);
});

async function syncAllWorlds(store: Store) {
  for (const world of worlds) {
    const channel = await client.channels.fetch(world.channelId);
    if (!(channel instanceof TextChannel)) {
      throw new Error(`World "${world.id}" must point to a readable text channel.`);
    }

    const messages = await channel.messages.fetch({ limit: 100 });
    for (const message of messages.values()) {
      ingestMessage(store, world, message);
    }
  }
}

function ingestMessage(store: Store, world: WorldConfig, message: Message) {
  const content = message.content.trim();
  if (!content) {
    return;
  }

  const author = message.member?.displayName ?? message.author.displayName;
  const source = message.webhookId || author.toLowerCase().includes("mvmp") ? "minecraft" : "discord";
  const storedMessage: StoredMessage = {
    id: message.id,
    worldId: world.id,
    channelId: world.channelId,
    author,
    content,
    createdAt: message.createdAt.toISOString(),
    source
  };

  upsertById(store.messages, storedMessage);

  const parsedEvent = parseEvent(world.id, storedMessage);
  if (parsedEvent) {
    upsertById(store.events, parsedEvent);
    applyPlayerEvent(store, parsedEvent);
    applyServerEvent(store, parsedEvent);
  }

  store.updatedAt = new Date().toISOString();
}

function parseEvent(worldId: string, message: StoredMessage): StoredEvent | null {
  const joined = message.content.match(/^(.+) joined the server\.$/i);
  if (joined?.[1]) {
    return {
      id: `join:${message.id}`,
      worldId,
      type: "join",
      player: joined[1],
      summary: `${joined[1]} joined the server`,
      createdAt: message.createdAt
    };
  }

  const left = message.content.match(/^(.+) left the server\.$/i);
  if (left?.[1]) {
    return {
      id: `leave:${message.id}`,
      worldId,
      type: "leave",
      player: left[1],
      summary: `${left[1]} left the server`,
      createdAt: message.createdAt
    };
  }

  if (/^server started\.$/i.test(message.content) || /^server stopped\.$/i.test(message.content)) {
    return {
      id: `server:${message.id}`,
      worldId,
      type: "server",
      summary: message.content,
      createdAt: message.createdAt
    };
  }

  const chat = message.content.match(/^<([^>]+)> (.+)$/);
  if (chat?.[1]) {
    return {
      id: `chat:${message.id}`,
      worldId,
      type: "chat",
      player: chat[1],
      summary: message.content,
      createdAt: message.createdAt
    };
  }

  return null;
}

function applyPlayerEvent(store: Store, event: StoredEvent) {
  if (!event.player) {
    return;
  }

  const existing = store.players.find(
    (player) => player.name.toLowerCase() === event.player?.toLowerCase() && player.worldId === event.worldId
  );
  const next: PlayerStatus = {
    name: event.player,
    worldId: event.worldId,
    online: event.type === "join" ? true : event.type === "leave" ? false : existing?.online ?? false,
    lastSeenAt: event.createdAt,
    lastEvent:
      event.type === "join"
        ? "joined"
        : event.type === "leave"
          ? "left"
          : event.type === "chat"
            ? "chat"
            : event.type === "death"
              ? "death"
              : "unknown"
  };

  if (existing) {
    Object.assign(existing, next);
  } else {
    store.players.push(next);
  }
}

function applyServerEvent(store: Store, event: StoredEvent) {
  if (event.type !== "server" || !/server stopped\./i.test(event.summary)) {
    return;
  }

  for (const player of store.players) {
    if (player.worldId === event.worldId) {
      player.online = false;
      player.lastSeenAt = event.createdAt;
      player.lastEvent = "unknown";
    }
  }
}

async function loadStore(): Promise<Store> {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as Store;
    parsed.worlds = worlds;
    return parsed;
  } catch {
    return {
      version: 1,
      worlds,
      messages: [],
      players: [],
      events: [],
      updatedAt: new Date().toISOString()
    };
  }
}

async function saveAndExport(store: Store) {
  store.messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  store.events.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  store.updatedAt = new Date().toISOString();

  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");

  await mkdir(resolve(publicOutputDir, "feeds"), { recursive: true });
  await mkdir(resolve(publicOutputDir, "status"), { recursive: true });

  await writeFile(
    resolve(publicOutputDir, "worlds.json"),
    JSON.stringify(
      {
        updatedAt: store.updatedAt,
        worlds: store.worlds.map((world) => ({
          ...world,
          channelId: undefined,
          onlinePlayers: store.players.filter((player) => player.worldId === world.id && player.online).length,
          totalKnownPlayers: store.players.filter((player) => player.worldId === world.id).length
        }))
      },
      null,
      2
    ),
    "utf8"
  );

  for (const world of store.worlds) {
    const feed = store.messages
      .filter((message) => message.worldId === world.id)
      .slice(-100)
      .reverse();
    const status = {
      world,
      updatedAt: store.updatedAt,
      onlinePlayers: store.players.filter((player) => player.worldId === world.id && player.online),
      knownPlayers: store.players.filter((player) => player.worldId === world.id),
      recentEvents: store.events.filter((event) => event.worldId === world.id).slice(-50).reverse()
    };

    await writeFile(resolve(publicOutputDir, "feeds", `${world.id}.json`), JSON.stringify(feed, null, 2), "utf8");
    await writeFile(resolve(publicOutputDir, "status", `${world.id}.json`), JSON.stringify(status, null, 2), "utf8");
  }

  const firstWorld = store.worlds[0];
  if (firstWorld) {
    const legacyFeed = store.messages
      .filter((message) => message.worldId === firstWorld.id)
      .slice(-50)
      .reverse();
    await writeFile(resolve(publicOutputDir, "..", "feed.json"), JSON.stringify(legacyFeed, null, 2), "utf8");
  }

  console.log(`Stored ${store.messages.length} messages and exported ${store.worlds.length} worlds.`);
}

function parseWorlds(): WorldConfig[] {
  const raw = process.env.MVMP_WORLDS;
  if (raw) {
    const parsedWorlds = raw
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [id, channelId, name = id, description = "A world on the MVMP server."] = entry.split(":");
        const resolvedChannelId =
          channelId === "DISCORD_CHANNEL_ID" ? process.env.DISCORD_CHANNEL_ID ?? "" : channelId;

        return { id, channelId: resolvedChannelId, name, description };
      })
      .filter((world) => world.id && world.channelId && world.channelId !== "DISCORD_CHANNEL_ID");

    if (parsedWorlds.length > 0) {
      return parsedWorlds;
    }
  }

  const channelId = process.env.DISCORD_CHANNEL_ID;
  return channelId
    ? [
        {
          id: "main",
          name: "Main World",
          channelId,
          description: "The main MVMP world."
        }
      ]
    : [];
}

function upsertById<T extends { id: string }>(items: T[], item: T) {
  const index = items.findIndex((candidate) => candidate.id === item.id);
  if (index >= 0) {
    items[index] = item;
  } else {
    items.push(item);
  }
}

void client.login(requiredToken);
