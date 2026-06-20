import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Activity, MessageSquareText, Server, ShieldCheck, UsersRound } from "lucide-react";
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
    fetch("/feed.json")
      .then((response) => response.json())
      .then(setFeed)
      .catch(() => setFeed([]));
  }, []);

  return (
    <main className="app-shell">
      <section className="status-panel" aria-label="MVMP status">
        <div>
          <p className="eyebrow">MVMP</p>
          <h1>친구들과 마인크래프트를 더 재밌게.</h1>
          <p className="summary">
            서버 호스팅, Discord 브릿지, 웹 대시보드를 하나의 프로젝트로 묶는 시작점입니다.
          </p>
        </div>

        <div className="metric-grid">
          <Metric icon={<Server size={20} />} label="Server" value="Paper" />
          <Metric icon={<MessageSquareText size={20} />} label="Bridge" value="Webhook" />
          <Metric icon={<Activity size={20} />} label="Web" value="Vite" />
          <Metric icon={<UsersRound size={20} />} label="Players" value="Ready" />
        </div>
      </section>

      <section className="feed-section" aria-label="MVMP feed">
        <div className="section-heading">
          <h2>최근 소식</h2>
          <span>Discord channel feed</span>
        </div>

        <div className="feed-list">
          {feed.map((item) => (
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
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <span>MVMP</span>
        <nav aria-label="Legal links">
          <a href={appHref("terms")}>이용약관</a>
          <a href={appHref("privacy")}>개인정보 처리방침</a>
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
          <a href={appHref("terms")}>이용약관</a>
          <a href={appHref("privacy")}>개인정보 처리방침</a>
        </nav>
      </footer>
    </main>
  );
}

function TermsContent() {
  return (
    <article className="legal-document">
      <p className="eyebrow">MVMP</p>
      <h1>이용약관</h1>
      <p className="legal-lead">
        본 약관은 MVMP Minecraft 서버, Discord 봇, 웹 페이지 이용에 관한 기본 조건을 설명합니다.
      </p>

      <LegalSection title="1. 서비스 목적">
        <p>
          MVMP는 친구들과 Minecraft 멀티플레이를 즐기기 위해 운영되는 비상업적 커뮤니티
          프로젝트입니다. 서비스는 Minecraft 서버 호스팅, 서버 이벤트의 Discord 전달, Discord 채널
          정보의 웹 표시 기능을 포함할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="2. 이용 조건">
        <p>
          이용자는 Minecraft 서버와 Discord 서버의 규칙을 따라야 하며, 다른 이용자의 플레이 경험을
          방해하거나 서비스 운영을 훼손하는 행위를 해서는 안 됩니다.
        </p>
      </LegalSection>

      <LegalSection title="3. 금지 행위">
        <ul>
          <li>욕설, 괴롭힘, 혐오 표현, 스팸 등 커뮤니티에 해를 주는 행위</li>
          <li>서버 취약점 악용, 비인가 자동화, 치트 또는 악성 클라이언트 사용</li>
          <li>타인의 개인정보, 계정 정보, 비공개 대화 내용을 무단으로 공개하는 행위</li>
          <li>서비스 로그, Discord 메시지, 웹 표시 데이터를 악의적으로 조작하려는 행위</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. 서비스 변경 및 중단">
        <p>
          MVMP는 개인 프로젝트로 운영되므로 점검, 비용, 기술적 문제, 커뮤니티 운영 필요에 따라
          서비스 일부 또는 전체가 변경되거나 중단될 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="5. 콘텐츠와 책임">
        <p>
          이용자가 Minecraft 또는 Discord에서 작성한 채팅, 닉네임, 활동 기록은 서버 운영과 웹 표시를
          위해 사용될 수 있습니다. 이용자는 본인이 작성한 내용에 책임을 집니다.
        </p>
      </LegalSection>

      <LegalSection title="6. 제재">
        <p>
          운영자는 규칙 위반, 보안 위험, 커뮤니티 보호 필요가 있는 경우 경고, 메시지 삭제, 서버 접속
          제한, Discord 권한 제한 등의 조치를 할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="7. 문의">
        <p>
          약관 또는 서비스 이용에 관한 문의는 MVMP 운영자에게 Discord 서버 내 지정된 채널 또는 직접
          메시지로 연락해 주세요.
        </p>
      </LegalSection>
    </article>
  );
}

function PrivacyContent() {
  return (
    <article className="legal-document">
      <p className="eyebrow">MVMP</p>
      <h1>개인정보 처리방침</h1>
      <p className="legal-lead">
        본 방침은 MVMP가 Minecraft 서버, Discord 봇, 웹 페이지 운영 과정에서 어떤 정보를 처리하는지
        설명합니다.
      </p>

      <LegalSection title="1. 처리하는 정보">
        <ul>
          <li>Minecraft 닉네임, 접속/퇴장, 사망 메시지, 서버 채팅 등 서버 이벤트 정보</li>
          <li>Discord 사용자 표시 이름, 메시지 내용, 메시지 작성 시각, 채널 ID 등 채널 동기화 정보</li>
          <li>서비스 운영 중 생성되는 오류 로그, 접속 상태, 설정 정보</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. 정보 이용 목적">
        <p>
          수집된 정보는 Minecraft 서버 상태 공유, Discord 채널 동기화, 웹 페이지 표시, 문제 해결,
          커뮤니티 운영과 안전한 서비스 제공을 위해 사용됩니다.
        </p>
      </LegalSection>

      <LegalSection title="3. 공개 범위">
        <p>
          Minecraft 서버 이벤트는 설정된 Discord 채널로 전송될 수 있고, Discord 채널의 일부 메시지는
          MVMP 웹 페이지에 표시될 수 있습니다. 민감한 정보나 비공개 대화는 공개 채널에 작성하지 않는
          것을 권장합니다.
        </p>
      </LegalSection>

      <LegalSection title="4. 보관 기간">
        <p>
          웹 표시용 Discord 피드는 최근 메시지 중심으로 갱신되며, 운영 로그와 서버 데이터는 서비스
          운영상 필요한 기간 동안 보관될 수 있습니다. 불필요해진 정보는 운영자가 정리할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="5. 제3자 제공">
        <p>
          MVMP는 서비스 운영에 필요한 범위에서 Discord, Minecraft 서버 소프트웨어, 호스팅 환경을
          사용합니다. 별도의 판매 목적 또는 광고 목적의 개인정보 제공은 하지 않습니다.
        </p>
      </LegalSection>

      <LegalSection title="6. 이용자의 요청">
        <p>
          본인과 관련된 메시지 삭제, 웹 표시 제외, 데이터 처리 문의가 필요한 경우 MVMP 운영자에게
          Discord 서버 내 지정된 채널 또는 직접 메시지로 요청할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="7. 보안">
        <p>
          봇 토큰, webhook URL, 서버 설정 등 민감한 값은 비공개 환경 파일로 관리합니다. 다만 개인
          프로젝트 특성상 완전한 무중단 운영이나 절대적인 보안을 보장하지는 않습니다.
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
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short"
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
