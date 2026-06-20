import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Activity, BookOpen, Gamepad2, MessageSquareText, Server, ShieldCheck, UsersRound } from "lucide-react";
import "./styles.css";

type FeedItem = {
  id: string;
  worldId?: string;
  author: string;
  content: string;
  createdAt: string;
  source?: "discord" | "minecraft";
};

type WorldSummary = {
  id: string;
  name: string;
  description: string;
  onlinePlayers: number;
  totalKnownPlayers: number;
};

type PlayerStatus = {
  name: string;
  online: boolean;
  worldId: string;
  lastSeenAt: string;
  lastEvent: string;
};

type WorldEvent = {
  id: string;
  worldId: string;
  type: string;
  player?: string;
  summary: string;
  createdAt: string;
};

type WorldStatus = {
  world: WorldSummary;
  updatedAt: string;
  onlinePlayers: PlayerStatus[];
  knownPlayers: PlayerStatus[];
  recentEvents: WorldEvent[];
};

function App() {
  const path = getAppPath();

  if (path === "/terms") {
    return <LegalPage type="terms" />;
  }

  if (path === "/privacy") {
    return <LegalPage type="privacy" />;
  }

  if (path === "/guide") {
    return <GuidePage />;
  }

  if (path.startsWith("/worlds/")) {
    return <WorldPage worldId={path.replace("/worlds/", "").split("/")[0] || "main"} />;
  }

  return <HomePage />;
}

function HomePage() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [worlds, setWorlds] = useState<WorldSummary[]>([]);

  useEffect(() => {
    fetchJson<{ worlds: WorldSummary[] }>("data/worlds.json")
      .then((data) => setWorlds(data.worlds))
      .catch(() =>
        setWorlds([
          {
            id: "main",
            name: "Main World",
            description: "The main MVMP world.",
            onlinePlayers: 0,
            totalKnownPlayers: 0
          }
        ])
      );

    fetchJson<FeedItem[]>("feed.json")
      .then((data) => setFeed(data))
      .catch(() => setFeed([]));
  }, []);

  return (
    <main className="app-shell">
      <nav className="topbar" aria-label="Main navigation">
        <a className="brand-mark" href={appHref("")}>
          MVMP
        </a>
        <div className="topbar-links">
          <a href={appHref("guide")}>Guide</a>
          <a href={appHref("terms")}>Terms</a>
          <a href={appHref("privacy")}>Privacy</a>
        </div>
      </nav>

      <section className="status-panel" aria-label="MVMP status">
        <div>
          <p className="eyebrow">Block Party Server</p>
          <h1>Mine together. Chat everywhere.</h1>
          <p className="summary">
            MVMP links a private Minecraft server, Discord chat, and a tiny web dashboard for
            friends who want the world to feel alive even when they are away from spawn.
          </p>
        </div>

        <div className="metric-grid">
          <Metric icon={<Server size={20} />} label="Server Core" value="Paper" />
          <Metric icon={<MessageSquareText size={20} />} label="Discord Link" value="Live" />
          <Metric icon={<Gamepad2 size={20} />} label="Worlds" value={String(worlds.length || 1)} />
          <Metric icon={<UsersRound size={20} />} label="Online Now" value={String(sumOnline(worlds))} />
        </div>
      </section>

      <section className="world-section" aria-label="World selector">
        <div className="section-heading">
          <h2>World Select</h2>
          <span>Persistent logs per world</span>
        </div>

        <div className="world-grid">
          {worlds.map((world) => (
            <a className="world-card" href={appHref(`worlds/${world.id}`)} key={world.id}>
              <span className="world-card-kicker">World</span>
              <strong>{world.name}</strong>
              <p>{world.description}</p>
              <div className="world-card-stats">
                <span>{world.onlinePlayers} online</span>
                <span>{world.totalKnownPlayers} known</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="feed-section" aria-label="MVMP feed">
        <div className="section-heading">
          <h2>Latest Feed</h2>
          <span>Synced from the first world</span>
        </div>

        <FeedList feed={feed} emptyText="No synced messages yet. Start the Discord worker to fill this board." />
      </section>

      <footer className="site-footer">
        <span>MVMP</span>
        <nav aria-label="Legal links">
          <a href={appHref("guide")}>Guide</a>
          <a href={appHref("terms")}>Terms</a>
          <a href={appHref("privacy")}>Privacy</a>
        </nav>
      </footer>
    </main>
  );
}

function WorldPage({ worldId }: { worldId: string }) {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [status, setStatus] = useState<WorldStatus | null>(null);

  useEffect(() => {
    fetchJson<FeedItem[]>(`data/feeds/${worldId}.json`)
      .then(setFeed)
      .catch(() => setFeed([]));

    fetchJson<WorldStatus>(`data/status/${worldId}.json`)
      .then(setStatus)
      .catch(() => setStatus(null));
  }, [worldId]);

  const world = status?.world ?? {
    id: worldId,
    name: titleCase(worldId),
    description: "A world on the MVMP server.",
    onlinePlayers: 0,
    totalKnownPlayers: 0
  };

  return (
    <main className="app-shell">
      <nav className="topbar" aria-label="Main navigation">
        <a className="brand-mark" href={appHref("")}>
          MVMP
        </a>
        <div className="topbar-links">
          <a href={appHref("")}>Hub</a>
          <a href={appHref("guide")}>Guide</a>
          <a href={appHref("terms")}>Terms</a>
          <a href={appHref("privacy")}>Privacy</a>
        </div>
      </nav>

      <section className="world-hero">
        <p className="eyebrow">World Instance</p>
        <h1>{world.name}</h1>
        <p className="summary">{world.description}</p>
      </section>

      <section className="status-strip" aria-label="World status">
        <Metric icon={<UsersRound size={20} />} label="Online" value={String(status?.onlinePlayers.length ?? 0)} />
        <Metric icon={<Activity size={20} />} label="Known Players" value={String(status?.knownPlayers.length ?? 0)} />
        <Metric icon={<MessageSquareText size={20} />} label="Events Saved" value={String(status?.recentEvents.length ?? 0)} />
        <Metric icon={<Server size={20} />} label="Last Sync" value={status ? formatTime(status.updatedAt) : "Waiting"} />
      </section>

      <section className="world-section" aria-label="Online players">
        <div className="section-heading">
          <h2>Player Board</h2>
          <span>Persistent join and leave history</span>
        </div>
        <PlayerBoard players={status?.knownPlayers ?? []} />
      </section>

      <section className="feed-section" aria-label="World events">
        <div className="section-heading">
          <h2>Event Log</h2>
          <span>Stored across restarts</span>
        </div>
        <EventList events={status?.recentEvents ?? []} />
      </section>

      <section className="feed-section" aria-label="World feed">
        <div className="section-heading">
          <h2>World Feed</h2>
          <span>Discord channel archive</span>
        </div>
        <FeedList feed={feed} emptyText="No archived messages for this world yet." />
      </section>
    </main>
  );
}

function FeedList({ feed, emptyText }: { feed: FeedItem[]; emptyText: string }) {
  return (
    <div className="feed-list">
      {feed.length === 0 ? (
        <article className="feed-item">
          <div className="feed-dot system" />
          <div>
            <div className="feed-header">
              <h3>MVMP</h3>
              <time>Waiting</time>
            </div>
            <p>{emptyText}</p>
          </div>
        </article>
      ) : (
        feed.map((item) => (
          <article className="feed-item" key={item.id}>
            <div className={`feed-dot ${item.source === "minecraft" ? "system" : "chat"}`} />
            <div>
              <div className="feed-header">
                <h3>{item.author}</h3>
                <time>{formatTime(item.createdAt)}</time>
              </div>
              <p>{item.content}</p>
            </div>
          </article>
        ))
      )}
    </div>
  );
}

function PlayerBoard({ players }: { players: PlayerStatus[] }) {
  if (players.length === 0) {
    return <p className="empty-copy">No player history yet.</p>;
  }

  return (
    <div className="player-grid">
      {players.map((player) => (
        <article className={`player-card ${player.online ? "online" : ""}`} key={`${player.worldId}:${player.name}`}>
          <strong>{player.name}</strong>
          <span>{player.online ? "Online" : "Offline"}</span>
          <time>Last seen {formatTime(player.lastSeenAt)}</time>
        </article>
      ))}
    </div>
  );
}

function EventList({ events }: { events: WorldEvent[] }) {
  if (events.length === 0) {
    return <p className="empty-copy">No world events have been saved yet.</p>;
  }

  return (
    <div className="event-list">
      {events.map((event) => (
        <article className="event-row" key={event.id}>
          <span>{event.type}</span>
          <p>{event.summary}</p>
          <time>{formatTime(event.createdAt)}</time>
        </article>
      ))}
    </div>
  );
}

function GuidePage() {
  return (
    <main className="legal-shell">
      <header className="legal-header">
        <a className="home-link" href={appHref("")}>
          MVMP
        </a>
        <div className="legal-badge">
          <BookOpen size={18} />
          <span>Server Guide</span>
        </div>
      </header>

      <article className="legal-document">
        <p className="eyebrow">Operator Manual</p>
        <h1>Worlds, Plugins, and Logs</h1>
        <p className="legal-lead">
          Use this guide when adding a new Minecraft world, applying the MVMP Discord bridge plugin,
          and making sure each world appears on its own web page.
        </p>

        <div className="guide-grid">
          <GuideStep
            title="1. Create or open a world"
            body="Create worlds the way you normally do on the Paper server. The web dashboard uses the Bukkit world name, so names like world, world_nether, creative, or event_world become web world IDs."
            command="/mv create creative normal"
          />
          <GuideStep
            title="2. Keep one Discord log channel"
            body="You can use a single Discord channel for all worlds. The plugin writes a prefix like [world] or [creative], and the worker uses that prefix to split the history."
            command="#mvmp-log"
          />
          <GuideStep
            title="3. Build and copy the plugin"
            body="After code changes or a fresh setup, build the bridge and place the jar in the server plugins folder. The batch file does both."
            command="build-plugin.bat"
          />
          <GuideStep
            title="4. Restart the server"
            body="Restart Minecraft so Paper loads the latest MVMP Discord bridge. New messages should include the world prefix."
            command="start-minecraft-server.bat"
          />
          <GuideStep
            title="5. Run the Discord worker"
            body="The worker reads Discord messages, stores persistent history, detects join and leave events, and exports web data per world."
            command="start-discord-worker.bat"
          />
          <GuideStep
            title="6. Open the world page"
            body="When the worker sees [creative], it creates data for /worlds/creative. Unknown prefixes are auto-discovered and saved."
            command="/worlds/creative"
          />
        </div>

        <LegalSection title="World prefix format">
          <p>The bridge plugin sends messages like this:</p>
          <pre className="code-block">{`[world] Steve joined the server.
[creative] <Alex> look at this build
[world_nether] Steve left the server.`}</pre>
          <p>
            The prefix becomes the world page ID. For example, <code>[creative]</code> becomes{" "}
            <code>/worlds/creative</code>.
          </p>
        </LegalSection>

        <LegalSection title="Environment setup">
          <p>
            Use one fallback world for messages without a prefix. Additional worlds can be
            auto-discovered from Minecraft logs.
          </p>
          <pre className="code-block">{`DISCORD_CHANNEL_ID=123456789012345678
MVMP_WORLDS=main:DISCORD_CHANNEL_ID:Main World:Fallback world for messages without a [world] prefix`}</pre>
        </LegalSection>

        <LegalSection title="What gets saved">
          <ul>
            <li>Discord and Minecraft bridge messages are stored locally in persistent history.</li>
            <li>Join and leave messages update the last-known online/offline player board.</li>
            <li>Each world exports a feed and status file for the web dashboard.</li>
            <li>Restarting the worker does not wipe the saved history.</li>
          </ul>
        </LegalSection>

        <LegalSection title="Files to know">
          <ul>
            <li>
              <code>apps/discord-worker/data/mvmp-store.json</code> stores local history.
            </li>
            <li>
              <code>apps/discord-web/public/data/worlds.json</code> lists web worlds.
            </li>
            <li>
              <code>apps/discord-web/public/data/feeds/&lt;world-id&gt;.json</code> stores world feeds.
            </li>
            <li>
              <code>apps/discord-web/public/data/status/&lt;world-id&gt;.json</code> stores player status and events.
            </li>
          </ul>
        </LegalSection>
      </article>

      <footer className="site-footer">
        <span>MVMP Guide</span>
        <nav aria-label="Legal links">
          <a href={appHref("")}>Hub</a>
          <a href={appHref("terms")}>Terms</a>
          <a href={appHref("privacy")}>Privacy</a>
        </nav>
      </footer>
    </main>
  );
}

function GuideStep({ title, body, command }: { title: string; body: string; command: string }) {
  return (
    <section className="guide-step">
      <h2>{title}</h2>
      <p>{body}</p>
      <code>{command}</code>
    </section>
  );
}

function LegalPage({ type }: { type: "terms" | "privacy" }) {
  const isTerms = type === "terms";

  return (
    <main className="legal-shell">
      <header className="legal-header">
        <a className="home-link" href={appHref("")}>
          MVMP
        </a>
        <div className="legal-badge">
          <ShieldCheck size={18} />
          <span>{isTerms ? "Terms of Service" : "Privacy Policy"}</span>
        </div>
      </header>

      {isTerms ? <TermsContent /> : <PrivacyContent />}

      <footer className="site-footer">
        <span>Last updated: 2026-06-20</span>
        <nav aria-label="Legal links">
          <a href={appHref("guide")}>Guide</a>
          <a href={appHref("terms")}>Terms</a>
          <a href={appHref("privacy")}>Privacy</a>
        </nav>
      </footer>
    </main>
  );
}

function TermsContent() {
  return (
    <article className="legal-document">
      <p className="eyebrow">MVMP</p>
      <h1>Terms of Service</h1>
      <p className="legal-lead">
        These terms explain the basic rules for using the MVMP Minecraft server, Discord bot,
        and web dashboard.
      </p>

      <LegalSection title="1. Service purpose">
        <p>
          MVMP is a non-commercial community project for friends playing Minecraft together. The
          service may include server hosting, forwarding server events to Discord, and showing
          selected Discord channel information on the web dashboard.
        </p>
      </LegalSection>

      <LegalSection title="2. Community rules">
        <p>
          Players must follow the Minecraft server rules and Discord server rules. Do not disrupt
          other players, damage the community, or interfere with service operation.
        </p>
      </LegalSection>

      <LegalSection title="3. Prohibited behavior">
        <ul>
          <li>Harassment, hate speech, spam, or other behavior that harms the community</li>
          <li>Exploits, unauthorized automation, cheats, or malicious clients</li>
          <li>Sharing another person's private information, account details, or private messages</li>
          <li>Attempting to tamper with logs, Discord messages, or web feed data</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Changes and availability">
        <p>
          MVMP is run as a personal project. Features may change, pause, or stop because of
          maintenance, cost, technical issues, or community needs.
        </p>
      </LegalSection>

      <LegalSection title="5. Content responsibility">
        <p>
          Chat, nicknames, and activity created in Minecraft or Discord may be used for server
          operation and web display. You are responsible for the content you post.
        </p>
      </LegalSection>

      <LegalSection title="6. Moderation">
        <p>
          Operators may issue warnings, remove messages, limit server access, or restrict Discord
          permissions when needed to protect the community or service.
        </p>
      </LegalSection>

      <LegalSection title="7. Contact">
        <p>
          For questions about these terms or the service, contact the MVMP operator through the
          designated Discord channel or direct message.
        </p>
      </LegalSection>
    </article>
  );
}

function PrivacyContent() {
  return (
    <article className="legal-document">
      <p className="eyebrow">MVMP</p>
      <h1>Privacy Policy</h1>
      <p className="legal-lead">
        This policy explains what information MVMP processes while running the Minecraft server,
        Discord bot, and web dashboard.
      </p>

      <LegalSection title="1. Information processed">
        <ul>
          <li>Minecraft nicknames, join/leave events, death messages, and server chat</li>
          <li>Discord display names, message content, message timestamps, and channel IDs</li>
          <li>Error logs, service status, and configuration data generated during operation</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. How information is used">
        <p>
          Information is used to share Minecraft server activity, sync Discord channel data, render
          the web feed, troubleshoot issues, moderate the community, and keep the service running.
        </p>
      </LegalSection>

      <LegalSection title="3. Visibility">
        <p>
          Minecraft server events may be sent to configured Discord channels, and selected Discord
          messages may appear on the MVMP web dashboard. Avoid posting sensitive information in
          public channels.
        </p>
      </LegalSection>

      <LegalSection title="4. Retention">
        <p>
          The public web feed is refreshed around recent messages. Logs and server data may be kept
          as long as needed for operation, troubleshooting, or moderation, and may be cleaned up by
          the operator.
        </p>
      </LegalSection>

      <LegalSection title="5. Third-party services">
        <p>
          MVMP uses Discord, Minecraft server software, GitHub Pages, and hosting tools required to
          run the service. MVMP does not sell personal information or share it for advertising.
        </p>
      </LegalSection>

      <LegalSection title="6. User requests">
        <p>
          To request message removal, exclusion from the web display, or information about data
          processing, contact the MVMP operator through the designated Discord channel or direct
          message.
        </p>
      </LegalSection>

      <LegalSection title="7. Security">
        <p>
          Sensitive values such as bot tokens, webhook URLs, and server settings are kept in private
          environment files. MVMP is a personal project and cannot guarantee perfect security or
          uninterrupted availability.
        </p>
      </LegalSection>
    </article>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="legal-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function getAppPath() {
  const basePath = new URL(import.meta.env.BASE_URL, window.location.origin).pathname;
  const currentPath = window.location.pathname;
  const strippedPath = currentPath.startsWith(basePath)
    ? currentPath.slice(basePath.length - 1)
    : currentPath;

  return strippedPath === "" ? "/" : strippedPath;
}

function fetchJson<T>(path: string): Promise<T> {
  return fetch(appHref(path)).then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to load ${path}`);
    }

    return response.json() as Promise<T>;
  });
}

function sumOnline(worlds: WorldSummary[]) {
  return worlds.reduce((total, world) => total + world.onlinePlayers, 0);
}

function titleCase(value: string) {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function appHref(path: string) {
  return new URL(path, new URL(import.meta.env.BASE_URL, window.location.origin)).pathname;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="metric">
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
