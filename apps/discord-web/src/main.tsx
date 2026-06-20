import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Activity, Gamepad2, MessageSquareText, Server, ShieldCheck, UsersRound } from "lucide-react";
import "./styles.css";

type FeedItem = {
  id: string;
  author: string;
  content: string;
  createdAt: string;
};

function App() {
  const path = getAppPath();

  if (path === "/terms") {
    return <LegalPage type="terms" />;
  }

  if (path === "/privacy") {
    return <LegalPage type="privacy" />;
  }

  return <HomePage />;
}

function HomePage() {
  const [feed, setFeed] = useState<FeedItem[]>([]);

  useEffect(() => {
    fetch(appHref("feed.json"))
      .then((response) => response.json())
      .then(setFeed)
      .catch(() => setFeed([]));
  }, []);

  return (
    <main className="app-shell">
      <nav className="topbar" aria-label="Main navigation">
        <a className="brand-mark" href={appHref("")}>
          MVMP
        </a>
        <div className="topbar-links">
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
          <Metric icon={<Activity size={20} />} label="Web Feed" value="Online" />
          <Metric icon={<UsersRound size={20} />} label="Party Slots" value="Ready" />
        </div>
      </section>

      <section className="feed-section" aria-label="MVMP feed">
        <div className="section-heading">
          <h2>World Feed</h2>
          <span>Synced from Discord</span>
        </div>

        <div className="feed-list">
          {feed.length === 0 ? (
            <article className="feed-item">
              <div className="feed-dot system" />
              <div>
                <div className="feed-header">
                  <h3>MVMP</h3>
                  <time>Waiting</time>
                </div>
                <p>No synced messages yet. Start the Discord worker to fill this board.</p>
              </div>
            </article>
          ) : (
            feed.map((item) => (
            <article className="feed-item" key={item.id}>
              <div className="feed-dot chat" />
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
      </section>

      <footer className="site-footer">
        <span>MVMP</span>
        <nav aria-label="Legal links">
          <a href={appHref("terms")}>Terms</a>
          <a href={appHref("privacy")}>Privacy</a>
        </nav>
      </footer>
    </main>
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
