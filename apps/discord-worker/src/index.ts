import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  Client,
  GatewayIntentBits,
  Partials,
  TextChannel
} from "discord.js";

type PublicFeedItem = {
  id: string;
  author: string;
  content: string;
  createdAt: string;
};

const token = process.env.DISCORD_BOT_TOKEN;
const channelId = process.env.DISCORD_CHANNEL_ID;
const outputPath = resolve(
  process.cwd(),
  process.env.DISCORD_FEED_OUTPUT ?? "../discord-web/public/feed.json"
);

if (!token || !channelId) {
  throw new Error("DISCORD_BOT_TOKEN and DISCORD_CHANNEL_ID are required.");
}

const requiredToken = token;
const requiredChannelId = channelId;

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
  await syncLatestMessages();
});

client.on("messageCreate", async (message) => {
  if (message.channelId !== requiredChannelId || message.author.bot) {
    return;
  }

  await syncLatestMessages();
});

async function syncLatestMessages() {
  const channel = await client.channels.fetch(requiredChannelId);
  if (!(channel instanceof TextChannel)) {
    throw new Error("DISCORD_CHANNEL_ID must point to a readable text channel.");
  }

  const messages = await channel.messages.fetch({ limit: 50 });
  const feed = messages
    .filter((message) => !message.author.bot && message.content.trim().length > 0)
    .map<PublicFeedItem>((message) => ({
      id: message.id,
      author: message.member?.displayName ?? message.author.displayName,
      content: message.content,
      createdAt: message.createdAt.toISOString()
    }))
    .reverse();

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(feed, null, 2), "utf8");
  console.log(`Synced ${feed.length} messages to ${outputPath}`);
}

void client.login(requiredToken);
