import React, { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Box,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Code2,
  Command,
  Cpu,
  Database,
  ExternalLink,
  GitBranch,
  GitCommitHorizontal,
  GitMerge,
  HardDrive,
  LayoutDashboard,
  Layers3,
  Menu,
  Moon,
  MoreHorizontal,
  Network,
  Pause,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Terminal,
  TriangleAlert,
  Users,
  Workflow,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import {
  projects,
  initialPipelines,
  initialRunners,
  initialIncidents,
  initialFindings,
  filterRows,
  pipelineStats,
  seriesFor,
  duration,
  csv,
} from "./model.js";

const nav = [
  ["overview", "관제 개요", LayoutDashboard, "01"],
  ["pipelines", "파이프라인", Workflow, "02"],
  ["runners", "러너", Server, "03"],
  ["incidents", "인시던트", Radio, "04"],
  ["projects", "프로젝트", Layers3, "05"],
  ["activity", "개발 활동", GitMerge, "06"],
  ["security", "보안 센터", ShieldCheck, "07"],
  ["storage", "스토리지", Database, "08"],
];
const labels = {
  success: "성공",
  failed: "실패",
  running: "실행 중",
  online: "온라인",
  offline: "오프라인",
  paused: "일시중지",
  investigating: "조사 중",
  identified: "원인 확인",
  resolved: "해결됨",
  open: "미해결",
  critical: "치명적",
  high: "높음",
  medium: "보통",
  low: "낮음",
  warning: "주의",
  merged: "머지됨",
  review: "리뷰 대기",
  approved: "승인됨",
};
const tone = {
  success: "green",
  online: "green",
  resolved: "green",
  approved: "green",
  failed: "red",
  offline: "red",
  critical: "red",
  investigating: "orange",
  identified: "orange",
  paused: "muted",
  warning: "orange",
  running: "blue",
  high: "orange",
  medium: "yellow",
  low: "blue",
  open: "orange",
  merged: "purple",
  review: "blue",
};
const initialMR = projects.map((p, i) => ({
  id: 1480 - i,
  title: [
    "feat: 결제 재시도와 멱등성 키 지원",
    "perf: 콘솔 초기 로딩 시간 개선",
    "perf: 커넥션 풀 재사용",
    "feat: WebAuthn 패스키 로그인",
    "test: 주문 이벤트 통합 테스트",
    "chore: 분석 스키마 v3 마이그레이션",
  ][i],
  project: p.name,
  env: p.env,
  author: p.owner,
  status: ["review", "approved", "merged", "review", "review", "merged"][i],
  comments: [8, 3, 12, 5, 2, 4][i],
  changed: [12, 8, 4, 21, 6, 14][i],
}));
function load(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(`infradash-v1-${key}`));
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}
function useSaved(key, fallback) {
  const [value, set] = useState(() => load(key, fallback));
  useEffect(() => {
    try {
      localStorage.setItem(`infradash-v1-${key}`, JSON.stringify(value));
    } catch {}
  }, [value, key]);
  return [value, set];
}
function Badge({ status, children }) {
  return (
    <span className={`badge ${tone[status] || "muted"}`}>
      <span
        className={status === "running" ? "status-dot pulse" : "status-dot"}
      />
      {children || labels[status] || status}
    </span>
  );
}
function SmallIcon({ icon: Icon, className = "" }) {
  return (
    <span className={`small-icon ${className}`}>
      <Icon size={17} />
    </span>
  );
}
function Empty({ text = "조건에 맞는 항목이 없습니다." }) {
  return (
    <div className="empty">
      <Search size={24} />
      <strong>{text}</strong>
      <span>검색어나 필터를 변경해 보세요.</span>
    </div>
  );
}
function Panel({ title, eyebrow, action, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-head">
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
function LinkButton({ children = "전체 보기", onClick }) {
  return (
    <button className="text-button" onClick={onClick}>
      {children}
      <ArrowUpRight size={14} />
    </button>
  );
}
function Metric({
  label,
  value,
  unit,
  change,
  sub,
  icon: Icon,
  accent,
  onClick,
}) {
  return (
    <button className={`metric ${accent ? "accent" : ""}`} onClick={onClick}>
      <div className="metric-top">
        <span>{label}</span>
        <Icon size={18} />
      </div>
      <div className="metric-value">
        {value}
        <small>{unit}</small>
      </div>
      <div className="metric-bottom">
        <span className={accent ? "" : "metric-change"}>{change}</span>
        <span>{sub}</span>
        <ArrowUpRight size={15} />
      </div>
    </button>
  );
}
function Avatar({ name }) {
  return (
    <span
      className="avatar"
      style={{ "--avatar-hue": `${((name?.charCodeAt(0) || 1) * 13) % 360}` }}
    >
      {name?.slice(-2)}
    </span>
  );
}
function Progress({ value, warning = false }) {
  return (
    <div className="progress">
      <span
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        className={warning ? "warn" : ""}
      />
    </div>
  );
}

function PipelineChart({ days, setDays, env }) {
  const data = seriesFor(days, env);
  const [active, setActive] = useState(null);
  const max = 200;
  const w = 780,
    h = 176,
    left = 38,
    right = 10,
    gap = 6,
    bw = (w - left - right) / data.length - gap;
  const total = data.reduce((a, r) => a + r.success + r.failed, 0),
    rate = ((data.reduce((a, r) => a + r.success, 0) / total) * 100).toFixed(1);
  return (
    <Panel
      title="파이프라인 실행 추이"
      eyebrow="DELIVERY PERFORMANCE"
      action={
        <div className="segments">
          {[7, 14, 30].map((d) => (
            <button
              aria-pressed={days === d}
              className={days === d ? "selected" : ""}
              onClick={() => {
                setDays(d);
                setActive(null);
              }}
              key={d}
            >
              {d}일
            </button>
          ))}
        </div>
      }
      className="pipeline-chart"
    >
      <div className="chart-summary">
        <strong>
          {total.toLocaleString()}
          <small>회 실행</small>
        </strong>
        <span>
          <i className="legend success" />
          성공 {rate}%
        </span>
        <span>
          <i className="legend failed" />
          실패 {(100 - Number(rate)).toFixed(1)}%
        </span>
        <span className="chart-range">10/{32 - days} — 10/31</span>
      </div>
      <div className="chart-wrap">
        <svg
          viewBox={`0 0 ${w} ${h + 32}`}
          role="img"
          aria-label={`${days}일간 일별 파이프라인 성공 및 실패 건수`}
        >
          {[0, 50, 100, 150, 200].map((v) => (
            <g key={v}>
              <line
                x1={left}
                y1={h - (v / max) * (h - 12)}
                x2={w}
                y2={h - (v / max) * (h - 12)}
                className="chart-grid"
              />
              <text
                x="0"
                y={h - (v / max) * (h - 12) + 4}
                className="axis-label"
              >
                {v}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const x = left + i * (bw + gap) + 3,
              totalHeight = ((d.success + d.failed) / max) * (h - 12);
            return (
              <g
                key={i}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                onClick={() => setActive(active === i ? null : i)}
                tabIndex={0}
                role="button"
                aria-label={`${d.date}, 성공 ${d.success}건, 실패 ${d.failed}건`}
              >
                <rect
                  x={x - 3}
                  y="0"
                  width={bw + 6}
                  height={h + 25}
                  fill="transparent"
                />
                <rect
                  x={x}
                  y={h - (d.success / max) * (h - 12)}
                  width={bw}
                  height={(d.success / max) * (h - 12)}
                  rx="2"
                  className={
                    active === i ? "bar-success active" : "bar-success"
                  }
                />
                <rect
                  x={x}
                  y={h - totalHeight}
                  width={bw}
                  height={(d.failed / max) * (h - 12) - 1}
                  rx="2"
                  className="bar-failed"
                />
                {(i % Math.ceil(data.length / 7) === 0 ||
                  i === data.length - 1) && (
                  <text
                    x={x + bw / 2}
                    y={h + 23}
                    textAnchor="middle"
                    className="axis-label"
                  >
                    {d.date}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {active != null && (
          <div
            className="chart-tooltip"
            style={{
              left: `${Math.min(77, Math.max(7, (active / data.length) * 90))}%`,
            }}
          >
            <strong>{data[active].date}</strong>
            <span>
              성공 {data[active].success} · 실패 {data[active].failed}
            </span>
          </div>
        )}
      </div>
      <div className="chart-foot">
        <span>
          <span className="dot green" /> 배포 흐름은 안정적입니다
        </span>
        <span>일별 집계 · 모의 데이터</span>
      </div>
    </Panel>
  );
}
function RunnerSummary({ runners, onGo, onSelect }) {
  const online = runners.filter((r) => r.status === "online").length,
    offline = runners.filter((r) => r.status === "offline").length,
    paused = runners.filter((r) => r.status === "paused").length;
  const slots = runners.reduce(
      (a, r) => a + (r.status === "online" ? r.slots : 0),
      0,
    ),
    used = runners.reduce((a, r) => a + r.used, 0),
    load = slots ? Math.round((used / slots) * 100) : 0;
  return (
    <Panel
      title="러너 가용성"
      eyebrow="RUNNER FLEET"
      action={<LinkButton onClick={onGo} />}
      className="runner-summary"
    >
      <div className="runner-orbit">
        <svg
          viewBox="0 0 160 160"
          aria-label={`러너 ${runners.length}대 중 ${online}대 온라인`}
        >
          <circle cx="80" cy="80" r="62" className="ring-bg" />
          <circle
            cx="80"
            cy="80"
            r="62"
            className="ring-value"
            strokeDasharray={`${(online / Math.max(1, runners.length)) * 389} 389`}
          />
        </svg>
        <div>
          <strong>
            {online}
            <small> / {runners.length}</small>
          </strong>
          <span>온라인 러너</span>
        </div>
        <div className="orbit-label">
          <span className="dot green" />
          운영 가능
        </div>
      </div>
      <div className="runner-counts">
        <span>
          <i className="dot green" />
          온라인 <b>{online.toString().padStart(2, "0")}</b>
        </span>
        <span>
          <i className="dot orange" />
          일시중지 <b>{paused.toString().padStart(2, "0")}</b>
        </span>
        <span>
          <i className="dot muted" />
          오프라인 <b>{offline.toString().padStart(2, "0")}</b>
        </span>
      </div>
      <div className="capacity">
        <span>
          실행 슬롯 사용량{" "}
          <b>
            {used} / {slots}
          </b>
        </span>
        <Progress value={load} />
      </div>
      {runners.find((r) => r.status === "offline") && (
        <button
          className="runner-notice"
          onClick={() => onSelect(runners.find((r) => r.status === "offline"))}
        >
          <TriangleAlert size={14} />
          {offline}대의 러너가 응답하지 않습니다
          <ArrowRight size={14} />
        </button>
      )}
    </Panel>
  );
}
function PipelineTable({ rows, onSelect, compact = false }) {
  return rows.length ? (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>파이프라인 / 프로젝트</th>
            <th>상태</th>
            <th>브랜치</th>
            {!compact && <th>실행자</th>}
            <th>소요 시간</th>
            <th>실행 시점</th>
            <th aria-label="상세" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} onClick={() => onSelect(r)}>
              <td>
                <button
                  className="row-title"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(r);
                  }}
                >
                  <span className="mono dim">#{r.id}</span>
                  <strong>{r.project}</strong>
                </button>
                <span className="table-sub">{r.title}</span>
              </td>
              <td>
                <Badge status={r.status} />
              </td>
              <td>
                <span className="branch">
                  <GitBranch size={12} />
                  {r.branch}
                </span>
              </td>
              {!compact && (
                <td>
                  <span className="person">
                    <Avatar name={r.author} />
                    {r.author}
                  </span>
                </td>
              )}
              <td className="mono">{duration(r.duration)}</td>
              <td className="dim">
                {r.time === 0 ? "방금 전" : `${r.time}분 전`}
              </td>
              <td>
                <ChevronRight size={14} className="dim" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty />
  );
}

export default function App() {
  const route = () => {
    const key = window.location.hash.slice(1);
    return nav.some((n) => n[0] === key) || key === "settings"
      ? key
      : "overview";
  };
  const [page, setPage] = useState(route),
    [env, setEnv] = useState("all"),
    [days, setDays] = useState(14),
    [sidebar, setSidebar] = useState(false);
  const [runners, setRunners] = useSaved("runners", initialRunners),
    [incidents, setIncidents] = useSaved("incidents", initialIncidents),
    [findings, setFindings] = useSaved("findings", initialFindings),
    [mrs, setMrs] = useSaved("mrs", initialMR);
  const [pipelines, setPipelines] = useSaved("pipelines", initialPipelines),
    [checklist, setChecklist] = useSaved("checklist", []);
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState("all"),
    [severity, setSeverity] = useState("all"),
    [searchOpen, setSearchOpen] = useState(false),
    [search, setSearch] = useState(""),
    [detail, setDetail] = useState(null),
    [notifications, setNotifications] = useState(false),
    [toast, setToast] = useState(""),
    [refreshed, setRefreshed] = useState("14:20:00"),
    [busy, setBusy] = useState(false),
    [theme, setTheme] = useState(
      () => localStorage.getItem("infradash-theme") || "dark",
    ),
    [confirmReset, setConfirmReset] = useState(false);
  const dialogRef = useRef(null),
    pageRef = useRef(page),
    opener = useRef(null),
    toastTimer = useRef(null);
  const announce = (message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3800);
  };
  function go(next) {
    pageRef.current = next;
    window.location.hash = next;
    setPage(next);
    setQuery("");
    setStatus("all");
    setSeverity("all");
    setSidebar(false);
    setSearchOpen(false);
    setNotifications(false);
    setDetail(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function openDetail(type, item) {
    setDetail({ type, id: item.id ?? item.name });
  }
  useEffect(() => {
    const fn = () => {
      const next = route();
      if (pageRef.current !== next) {
        setQuery("");
        setStatus("all");
        setSeverity("all");
        setDetail(null);
        setSidebar(false);
      }
      pageRef.current = next;
      setPage(next);
    };
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("infradash-theme", theme);
  }, [theme]);
  useEffect(() => {
    document.title = `${nav.find((n) => n[0] === page)?.[1] || "설정"} · InfraDash`;
  }, [page]);
  useEffect(() => {
    const fn = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((s) => !s);
        setSearch("");
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setDetail(null);
        setNotifications(false);
        setSidebar(false);
        setConfirmReset(false);
      }
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);
  const modalOpen = searchOpen || !!detail || confirmReset;
  useEffect(() => {
    if (!modalOpen) return;
    opener.current = document.activeElement;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() =>
      dialogRef.current?.querySelector('input,button,[tabindex="0"]')?.focus(),
    );
    const trap = (e) => {
      if (e.key !== "Tab") return;
      const all = [
        ...(dialogRef.current?.querySelectorAll(
          'button:not([disabled]),input,select,textarea,a[href],[tabindex="0"]',
        ) || []),
      ].filter((el) => el.getClientRects().length);
      if (!all.length) return;
      if (e.shiftKey && document.activeElement === all[0]) {
        e.preventDefault();
        all.at(-1).focus();
      } else if (!e.shiftKey && document.activeElement === all.at(-1)) {
        e.preventDefault();
        all[0].focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = before;
      document.removeEventListener("keydown", trap);
      opener.current?.focus?.();
    };
  }, [modalOpen, searchOpen, detail?.type, confirmReset]);
  const scoped = (rows) => filterRows(rows, { env }),
    filtered = (rows) =>
      filterRows(rows, { env, status, query }).filter(
        (r) =>
          page !== "security" || severity === "all" || r.severity === severity,
      );
  const pScope = scoped(pipelines),
    rScope = scoped(runners),
    iScope = scoped(incidents),
    fScope = scoped(findings),
    prScope = scoped(projects),
    stats = pipelineStats(pScope),
    activeIncidents = iScope.filter((r) => r.status !== "resolved");
  const current = nav.find((n) => n[0] === page),
    pageTitle = current?.[1] || "워크스페이스 설정";
  const item = detail
    ? (
        {
          pipeline: pipelines,
          runner: runners,
          incident: incidents,
          project: projects,
          finding: findings,
          mr: mrs,
        }[detail.type] || []
      ).find((r) => (r.id ?? r.name) === detail.id)
    : null;
  const detailTitle = item?.name || item?.title || `파이프라인 #${item?.id}`;
  function exportData() {
    const data =
      {
        overview: pScope,
        pipelines: filtered(pipelines),
        runners: filtered(runners),
        incidents: filtered(incidents),
        projects: filtered(projects),
        security: filtered(findings),
        activity: filtered(mrs),
        storage: filtered(projects),
      }[page] || projects;
    const keys = data.length
      ? Object.keys(data[0]).filter(
          (k) => !["timeline", "stages", "description"].includes(k),
        )
      : ["id", "status"];
    const link = document.createElement("a");
    const url = URL.createObjectURL(
      new Blob([csv(data, keys)], { type: "text/csv;charset=utf-8;" }),
    );
    link.href = url;
    link.download = `infradash-${page}-${env}-2026-10-31.csv`;
    link.click();
    URL.revokeObjectURL(url);
    announce(`${data.length}개 항목을 CSV로 내보냈습니다.`);
  }
  function refresh() {
    setBusy(true);
    setTimeout(() => {
      setRefreshed(
        new Date().toLocaleTimeString("ko-KR", {
          hour12: false,
          timeZone: "Asia/Seoul",
        }),
      );
      setBusy(false);
      announce(
        "로컬 데모 상태를 다시 불러왔습니다. 외부 API는 연결되어 있지 않습니다.",
      );
    }, 650);
  }
  function retry(p) {
    const next = {
      ...p,
      id: Math.max(...pipelines.map((p) => p.id)) + 1,
      status: "running",
      time: 0,
      duration: 0,
    };
    setPipelines((rows) => [next, ...rows]);
    setDetail({ type: "pipeline", id: next.id });
    announce(`데모 파이프라인 #${next.id} 실행을 시작했습니다.`);
  }
  const filterBar = (placeholder, options) => (
    <div className="filter-bar">
      <div className="input-wrap">
        <Search size={16} />
        <input
          aria-label={placeholder}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button aria-label="검색 지우기" onClick={() => setQuery("")}>
            <X size={14} />
          </button>
        )}
      </div>
      <div className="filter-right">
        <SlidersHorizontal size={15} />
        <select
          aria-label="상태 필터"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">모든 상태</option>
          {options.map((s) => (
            <option key={s} value={s}>
              {labels[s]}
            </option>
          ))}
        </select>
        <span className="filter-count">
          {env === "all" ? "전체 환경" : env}
        </span>
      </div>
    </div>
  );
  const searchResults = [
    ...nav.map(([key, label, Icon]) => ({
      kind: "메뉴",
      title: label,
      subtitle: key,
      Icon,
      action: () => go(key),
    })),
    ...scoped(projects).map((p) => ({
      kind: "프로젝트",
      title: p.name,
      subtitle: p.group,
      Icon: Box,
      action: () => {
        setSearchOpen(false);
        openDetail("project", p);
      },
    })),
    ...scoped(incidents).map((p) => ({
      kind: "인시던트",
      title: p.title,
      subtitle: p.id,
      Icon: Radio,
      action: () => {
        setSearchOpen(false);
        openDetail("incident", p);
      },
    })),
    ...scoped(runners).map((p) => ({
      kind: "러너",
      title: p.name,
      subtitle: labels[p.status],
      Icon: Server,
      action: () => {
        setSearchOpen(false);
        openDetail("runner", p);
      },
    })),
  ].filter((r) =>
    (r.title + " " + r.subtitle).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content").focus();
        }}
      >
        본문으로 건너뛰기
      </a>
      {sidebar && (
        <button
          className="sidebar-scrim"
          aria-label="메뉴 닫기"
          onClick={() => setSidebar(false)}
        />
      )}
      <aside className={`sidebar ${sidebar ? "is-open" : ""}`}>
        <a
          className="brand"
          href="#overview"
          onClick={(e) => {
            e.preventDefault();
            go("overview");
          }}
        >
          <span className="brand-mark">
            <i />
            <i />
            <i />
          </span>
          <span>
            infra<span className="brand-light">dash</span>
            <small>GITLAB OPERATIONS</small>
          </span>
          <span className="brand-edition">/ C</span>
        </a>
        <button className="workspace" onClick={() => go("settings")}>
          <span className="workspace-avatar">
            <Box size={19} />
          </span>
          <span>
            <strong>Acme Engineering</strong>
            <small>Self-managed GitLab</small>
          </span>
          <ChevronDown size={14} />
        </button>
        <div className="nav-label">
          WORKSPACE <span>⌘</span>
        </div>
        <nav aria-label="주 메뉴">
          {nav.map(([key, label, Icon, num], i) => (
            <React.Fragment key={key}>
              {i === 4 && <div className="nav-label second">RESOURCES</div>}
              <a
                href={`#${key}`}
                className={`nav-item ${page === key ? "active" : ""}`}
                aria-current={page === key ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  go(key);
                }}
              >
                <Icon size={18} />
                <span>{label}</span>
                {key === "incidents" &&
                incidents.filter((i) => i.status !== "resolved").length > 0 ? (
                  <b className="nav-badge">
                    {incidents.filter((i) => i.status !== "resolved").length}
                  </b>
                ) : key === "runners" &&
                  runners.some((r) => r.status === "offline") ? (
                  <span className="nav-dot" />
                ) : (
                  <small>{num}</small>
                )}
              </a>
            </React.Fragment>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="instance-card">
            <span className="instance-label">
              <span className="dot green" />
              INSTANCE STATUS
            </span>
            <strong>데모 인스턴스 정상</strong>
            <div>
              <span>GitLab 17.8.7</span>
              <span className="demo-tag">DEMO</span>
            </div>
            <div className="mini-status">
              {Array.from({ length: 28 }, (_, i) => (
                <i key={i} />
              ))}
            </div>
            <small>실제 서버에 연결되지 않은 데모</small>
          </div>
          <button
            className={`nav-item settings ${page === "settings" ? "active" : ""}`}
            onClick={() => go("settings")}
          >
            <Settings2 size={18} />
            <span>워크스페이스 설정</span>
          </button>
          <div className="profile">
            <Avatar name="김인프라" />
            <span>
              <strong>김인프라</strong>
              <small>Infrastructure admin</small>
            </span>
            <button
              aria-label={
                theme === "dark" ? "라이트 테마로 변경" : "다크 테마로 변경"
              }
              className="icon-button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="메뉴 열기"
              onClick={() => setSidebar(true)}
            >
              <Menu size={20} />
            </button>
            <span className="desktop-inline">워크스페이스</span>
            <ChevronRight size={13} className="desktop-inline" />
            <strong>{pageTitle}</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="search-trigger"
              onClick={() => {
                setSearchOpen(true);
                setSearch("");
              }}
            >
              <Search size={15} />
              <span>무엇을 찾고 있나요?</span>
              <kbd>Ctrl K</kbd>
            </button>
            <span className="topbar-divider" />
            <button
              className={`icon-button notification-button ${notifications ? "selected" : ""}`}
              aria-label="알림 보기"
              onClick={() => setNotifications(!notifications)}
            >
              <Bell size={18} />
              {activeIncidents.length > 0 && <i />}
            </button>
            <span className="topbar-avatar">KI</span>
          </div>
          {notifications && (
            <div className="notifications">
              <div className="panel-head">
                <h2>운영 알림</h2>
                <button
                  className="icon-button"
                  aria-label="알림 닫기"
                  onClick={() => setNotifications(false)}
                >
                  <X size={16} />
                </button>
              </div>
              {activeIncidents.map((i) => (
                <button
                  onClick={() => {
                    setNotifications(false);
                    openDetail("incident", i);
                  }}
                  key={i.id}
                >
                  <TriangleAlert size={17} />
                  <span>
                    <strong>{i.title}</strong>
                    <small>
                      {i.id} · {i.started} · {labels[i.status]}
                    </small>
                  </span>
                  <ChevronRight size={14} />
                </button>
              ))}
              {!activeIncidents.length && (
                <p className="dim">진행 중인 인시던트가 없습니다.</p>
              )}
              <button onClick={() => go("security")}>
                <ShieldCheck size={17} />
                <span>
                  <strong>보안 검토가 필요합니다</strong>
                  <small>
                    미해결 탐지{" "}
                    {fScope.filter((f) => f.status === "open").length}건
                  </small>
                </span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </header>
        <main id="main-content" tabIndex={-1}>
          <div className="page-heading">
            <div>
              <div className="page-kicker">
                <span className="dot green" /> YOUR INFRASTRUCTURE, IN FOCUS
              </div>
              <h1>
                {page === "overview" ? (
                  <>
                    운영의 흐름을, 한눈에<span className="heading-dot">.</span>
                  </>
                ) : (
                  pageTitle
                )}
              </h1>
              <p>
                {
                  {
                    overview:
                      "작은 신호부터 중요한 변화까지. 오늘의 GitLab 인프라를 확인하세요.",
                    pipelines:
                      "코드가 서비스가 되기까지, 모든 실행의 흐름을 추적합니다.",
                    runners:
                      "빌드를 움직이는 인프라. 가용성과 실행 여유를 확인하세요.",
                    incidents: "신호를 놓치지 않고, 해결까지 한 흐름으로.",
                    projects:
                      "팀과 서비스를 연결하는 프로젝트의 현재 상태입니다.",
                    activity: "리뷰에서 머지까지, 팀의 개발 흐름을 확인하세요.",
                    security: "위험을 먼저 발견하고, 더 안전하게 배포하세요.",
                    storage:
                      "저장소부터 아티팩트까지, 공간의 쓰임을 살펴보세요.",
                    settings: "데모 환경과 나만의 관제실을 관리합니다.",
                  }[page]
                }
              </p>
            </div>
            <div className="heading-actions">
              <div className="env-select">
                <span className="dot green" />
                <select
                  aria-label="환경 선택"
                  value={env}
                  onChange={(e) => {
                    setEnv(e.target.value);
                    setStatus("all");
                  }}
                >
                  <option value="all">전체 환경</option>
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                </select>
              </div>
              <button className="button export-button" onClick={exportData}>
                <ArrowDownToLine size={15} />
                <span>내보내기</span>
              </button>
            </div>
          </div>
          <div className="context-bar">
            <div>
              <span className="demo-pill">
                <span className="dot" /> INTERACTIVE DEMO
              </span>
              <span>
                2026.10.31 <span className="context-time">/ KST</span>
              </span>
              <span className="context-separator">·</span>
              <span className="context-time">모의 데이터 기반</span>
            </div>
            <button onClick={refresh} disabled={busy}>
              <RefreshCw size={12} className={busy ? "spin" : ""} />
              <span>마지막 동기화 {refreshed}</span>
            </button>
          </div>

          {page === "overview" && (
            <>
              {activeIncidents.length > 0 ? (
                <button
                  className="incident-banner"
                  onClick={() => openDetail("incident", activeIncidents[0])}
                >
                  <span className="incident-icon">
                    <Radio size={20} />
                  </span>
                  <span className="incident-severity">
                    {activeIncidents[0].severity}
                  </span>
                  <div>
                    <strong>{activeIncidents[0].title}</strong>
                    <span>
                      {activeIncidents[0].project} <i>·</i>{" "}
                      {labels[activeIncidents[0].status]} <i>·</i>{" "}
                      {activeIncidents[0].started} KST 발생
                    </span>
                  </div>
                  <span className="incident-owner">
                    <Avatar name={activeIncidents[0].owner} />
                    <span>{activeIncidents[0].owner}</span>
                  </span>
                  <span className="incident-cta">
                    상세 보기
                    <ArrowUpRight size={16} />
                  </span>
                </button>
              ) : (
                <div className="healthy-banner">
                  <CheckCircle2 size={19} />
                  <strong>진행 중인 인시던트가 없습니다.</strong>
                  <span>현재 환경의 모든 이슈가 해결되었습니다.</span>
                </div>
              )}
              <div className="metrics-grid">
                <Metric
                  label="파이프라인 성공률"
                  value={stats.rate}
                  unit="%"
                  change={`${pScope.filter((p) => p.status === "success").length}건 성공`}
                  sub="완료된 실행 기준"
                  icon={Workflow}
                  accent
                  onClick={() => go("pipelines")}
                />
                <Metric
                  label="평균 실행 시간"
                  value={`${Math.floor(stats.average / 60)}:${String(stats.average % 60).padStart(2, "0")}`}
                  change={`${stats.total}회 실행`}
                  sub="최근 파이프라인"
                  icon={Clock3}
                  onClick={() => go("pipelines")}
                />
                <Metric
                  label="가용 러너"
                  value={rScope
                    .filter((r) => r.status === "online")
                    .length.toString()
                    .padStart(2, "0")}
                  unit={`/ ${rScope.length.toString().padStart(2, "0")}`}
                  change={`${rScope.filter((r) => r.status === "offline").length}대 오프라인`}
                  sub="현재 상태"
                  icon={Cpu}
                  onClick={() => go("runners")}
                />
                <Metric
                  label="활성 프로젝트"
                  value={prScope.length.toString().padStart(2, "0")}
                  unit="개"
                  change={`${prScope.reduce((a, p) => a + p.commits, 0)} commits`}
                  sub="이번 주 활동"
                  icon={Layers3}
                  onClick={() => go("projects")}
                />
              </div>
              <div className="overview-charts">
                <PipelineChart days={days} setDays={setDays} env={env} />
                <RunnerSummary
                  runners={rScope}
                  onGo={() => go("runners")}
                  onSelect={(r) => openDetail("runner", r)}
                />
              </div>
              <div className="overview-lower">
                <Panel
                  title="최근 파이프라인"
                  eyebrow="LATEST RUNS"
                  action={<LinkButton onClick={() => go("pipelines")} />}
                  className="recent-pipelines"
                >
                  <PipelineTable
                    rows={pScope.slice(0, 5)}
                    onSelect={(p) => openDetail("pipeline", p)}
                    compact
                  />
                </Panel>
                <Panel
                  title="지금 확인할 항목"
                  eyebrow="NEEDS ATTENTION"
                  action={
                    <span className="count-pill">
                      {activeIncidents.length +
                        fScope.filter(
                          (f) =>
                            f.status === "open" && f.severity === "critical",
                        ).length +
                        rScope.filter((r) => r.status === "offline").length}
                    </span>
                  }
                  className="attention-panel"
                >
                  <button onClick={() => go("incidents")}>
                    <SmallIcon icon={Radio} className="orange" />
                    <span>
                      <strong>진행 중인 인시던트</strong>
                      <small>빠른 확인과 대응이 필요해요</small>
                    </span>
                    <b>{activeIncidents.length.toString().padStart(2, "0")}</b>
                    <ChevronRight size={14} />
                  </button>
                  <button onClick={() => go("security")}>
                    <SmallIcon icon={ShieldCheck} className="red" />
                    <span>
                      <strong>치명적 보안 탐지</strong>
                      <small>서비스 배포 전 검토하세요</small>
                    </span>
                    <b>
                      {fScope
                        .filter(
                          (f) =>
                            f.status === "open" && f.severity === "critical",
                        )
                        .length.toString()
                        .padStart(2, "0")}
                    </b>
                    <ChevronRight size={14} />
                  </button>
                  <button onClick={() => go("runners")}>
                    <SmallIcon icon={Server} />
                    <span>
                      <strong>오프라인 러너</strong>
                      <small>연결 및 노드 상태를 점검하세요</small>
                    </span>
                    <b>
                      {rScope
                        .filter((r) => r.status === "offline")
                        .length.toString()
                        .padStart(2, "0")}
                    </b>
                    <ChevronRight size={14} />
                  </button>
                  <div className="oncall">
                    <span className="oncall-icon">
                      <Users size={17} />
                    </span>
                    <div>
                      <small>오늘의 온콜</small>
                      <strong>
                        강현우 <span>Platform / SRE</span>
                      </strong>
                    </div>
                    <Avatar name="강현우" />
                  </div>
                  <button
                    className="oncall-link"
                    onClick={() => go("incidents")}
                  >
                    인시던트 대응 현황
                    <ArrowUpRight size={14} />
                  </button>
                </Panel>
              </div>
              <div className="bottom-grid">
                <Panel
                  title="서비스 상태"
                  action={<LinkButton onClick={() => go("projects")} />}
                >
                  <div className="service-list">
                    {prScope.slice(0, 4).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => openDetail("project", p)}
                      >
                        <span
                          className={`dot ${p.health === "warning" && activeIncidents.some((i) => i.project === p.name) ? "orange" : "green"}`}
                        />
                        <strong>{p.name}</strong>
                        <span className="service-uptime">
                          {p.availability}%
                        </span>
                        <div className="uptime-bars">
                          {Array.from({ length: 22 }, (_, i) => (
                            <i
                              key={i}
                              className={
                                p.health === "warning" && i === 18 ? "warn" : ""
                              }
                            />
                          ))}
                        </div>
                        <ChevronRight size={14} />
                      </button>
                    ))}
                  </div>
                  <div className="service-foot">
                    <span>30일 가용성 · 모의 SLI</span>
                    <span>
                      정상 <i className="dot green" /> 주의{" "}
                      <i className="dot orange" />
                    </span>
                  </div>
                </Panel>
                <Panel
                  title="팀의 최근 움직임"
                  action={<LinkButton onClick={() => go("activity")} />}
                >
                  <div className="activity-feed">
                    {scoped(mrs)
                      .slice(0, 3)
                      .map((mr, i) => (
                        <button
                          key={mr.id}
                          onClick={() => openDetail("mr", mr)}
                        >
                          <span className={`feed-icon ${tone[mr.status]}`}>
                            <GitMerge size={15} />
                          </span>
                          <span>
                            <strong>
                              {mr.author}{" "}
                              <em>
                                {mr.status === "merged"
                                  ? "님이 머지했어요"
                                  : mr.status === "approved"
                                    ? "님의 리뷰가 승인됐어요"
                                    : "님이 리뷰를 기다리고 있어요"}
                              </em>
                            </strong>
                            <small>
                              {mr.project} <span>!{mr.id}</span>
                            </small>
                          </span>
                          <time>{i * 12 + 3}분 전</time>
                        </button>
                      ))}
                  </div>
                </Panel>
              </div>
            </>
          )}

          {page === "pipelines" && (
            <>
              <div className="metrics-grid">
                <Metric
                  label="성공률"
                  value={stats.rate}
                  unit="%"
                  change="완료된 실행 기준"
                  sub=""
                  icon={CheckCheck}
                  accent
                  onClick={() => setStatus("success")}
                />
                <Metric
                  label="전체 실행"
                  value={stats.total}
                  unit="회"
                  change="로컬 실행 이력"
                  sub=""
                  icon={Workflow}
                  onClick={() => setStatus("all")}
                />
                <Metric
                  label="실행 중"
                  value={stats.running}
                  unit="건"
                  change="상세에서 단계 확인"
                  sub=""
                  icon={Play}
                  onClick={() => setStatus("running")}
                />
                <Metric
                  label="실패한 실행"
                  value={stats.failed}
                  unit="건"
                  change="상세에서 재실행 가능"
                  sub=""
                  icon={XCircle}
                  onClick={() => setStatus("failed")}
                />
              </div>
              <PipelineChart days={days} setDays={setDays} env={env} />
              <Panel
                title="실행 이력"
                eyebrow="PIPELINE EXPLORER"
                action={
                  <span className="count-pill">
                    {filtered(pipelines).length} runs
                  </span>
                }
              >
                {filterBar("프로젝트, 브랜치, 실행자 검색", [
                  "running",
                  "success",
                  "failed",
                ])}
                <PipelineTable
                  rows={filtered(pipelines)}
                  onSelect={(p) => openDetail("pipeline", p)}
                />
              </Panel>
            </>
          )}

          {page === "runners" && (
            <>
              <div className="section-overline">
                <span>
                  <Server size={16} /> {rScope.length} RUNNERS IN YOUR FLEET
                </span>
                <span>서울 리전 · 온프레미스</span>
              </div>
              {filterBar("러너 이름 검색", ["online", "offline", "paused"])}
              <div className="runner-grid">
                {filtered(runners).map((r) => (
                  <button
                    className={`runner-card ${r.status === "offline" ? "is-offline" : ""}`}
                    key={r.id}
                    onClick={() => openDetail("runner", r)}
                  >
                    <div className="runner-card-top">
                      <SmallIcon
                        icon={
                          r.type === "Kubernetes"
                            ? Network
                            : r.type === "Docker"
                              ? Box
                              : Terminal
                        }
                      />
                      <Badge status={r.status} />
                      <MoreHorizontal size={18} />
                    </div>
                    <h2>{r.name}</h2>
                    <span className="runner-location">
                      {r.type} <i>·</i> {r.region}
                    </span>
                    <div className="runner-load">
                      <div>
                        <span>
                          CPU
                          <b>
                            {r.cpu}
                            <small>%</small>
                          </b>
                        </span>
                        <Progress value={r.cpu} warning={r.cpu > 75} />
                      </div>
                      <div>
                        <span>
                          MEMORY
                          <b>
                            {r.memory}
                            <small>%</small>
                          </b>
                        </span>
                        <Progress value={r.memory} />
                      </div>
                    </div>
                    <div className="runner-card-foot">
                      <span>
                        <span
                          className={`dot ${r.status === "online" ? "green" : "muted"}`}
                        />
                        {r.used} / {r.slots} 슬롯 사용
                      </span>
                      <span>
                        v{r.version}
                        <ArrowUpRight size={14} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              {!filtered(runners).length && <Empty />}
              <div className="info-strip">
                <Terminal size={18} />
                <div>
                  <strong>러너 제어는 데모 모드에서 실행됩니다.</strong>
                  <span>
                    일시중지·재개·복구는 브라우저에만 저장되며 실제 인프라에
                    영향을 주지 않습니다.
                  </span>
                </div>
              </div>
            </>
          )}

          {page === "incidents" && (
            <>
              <div className="incident-stats">
                <div>
                  <span className="eyebrow">ACTIVE INCIDENTS</span>
                  <strong>
                    {activeIncidents.length.toString().padStart(2, "0")}
                    <small>진행 중</small>
                  </strong>
                </div>
                <div>
                  <span className="eyebrow">RESOLVED</span>
                  <strong>
                    {iScope
                      .filter((i) => i.status === "resolved")
                      .length.toString()
                      .padStart(2, "0")}
                    <small>해결됨</small>
                  </strong>
                </div>
                <div className="incident-oncall">
                  <Avatar name="강현우" />
                  <span>
                    <small>ON-CALL ENGINEER</small>
                    <strong>강현우 · Platform SRE</strong>
                    <span>오늘 09:00 — 내일 09:00 KST</span>
                  </span>
                  <span className="dot green" />
                </div>
              </div>
              <Panel
                title="인시던트 보드"
                eyebrow="DETECT → RESPOND → RESOLVE"
                action={<span className="demo-tag">로컬 데모</span>}
              >
                {filterBar("제목, 서비스, 담당자 검색", [
                  "investigating",
                  "identified",
                  "resolved",
                ])}
                <div className="incident-list">
                  {filtered(incidents).map((i) => (
                    <button
                      key={i.id}
                      className="incident-row"
                      onClick={() => openDetail("incident", i)}
                    >
                      <span className={`severity ${i.severity.toLowerCase()}`}>
                        {i.severity}
                      </span>
                      <div>
                        <span className="mono dim">
                          {i.id} <span className="env-inline">{i.env}</span>
                        </span>
                        <h3>{i.title}</h3>
                        <span className="dim">
                          {i.project} · {i.started} KST 발생
                        </span>
                      </div>
                      <Badge status={i.status} />
                      <span className="person">
                        <Avatar name={i.owner} />
                        {i.owner}
                      </span>
                      <ArrowUpRight size={18} />
                    </button>
                  ))}
                </div>
                {!filtered(incidents).length && <Empty />}
              </Panel>
              <div className="response-guide">
                <span className="eyebrow">RESPONSE PLAYBOOK</span>
                <h2>명확한 순서가, 빠른 복구를 만듭니다.</h2>
                <div>
                  {[
                    ["01", "상황 확인", "영향 범위와 심각도를 확인합니다."],
                    ["02", "원인 파악", "타임라인과 변경 사항을 점검합니다."],
                    [
                      "03",
                      "복구 및 검증",
                      "조치 후 서비스 정상화를 확인합니다.",
                    ],
                  ].map(([n, t, d]) => (
                    <div key={n}>
                      <span>{n}</span>
                      <h3>{t}</h3>
                      <p>{d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {page === "projects" && (
            <>
              <div className="section-overline">
                <span>
                  <Layers3 size={16} /> {prScope.length} ACTIVE PROJECTS
                </span>
                <span>
                  {prScope.reduce((a, p) => a + p.commits, 0)} commits this week
                </span>
              </div>
              <div className="filter-bar">
                <div className="input-wrap">
                  <Search size={16} />
                  <input
                    aria-label="프로젝트 검색"
                    placeholder="프로젝트 이름, 그룹, 담당자 검색"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <span className="filter-count">
                  {filtered(projects).length}개 프로젝트
                </span>
              </div>
              <div className="project-grid">
                {filtered(projects).map((p) => (
                  <button
                    className="project-card"
                    key={p.id}
                    onClick={() => openDetail("project", p)}
                  >
                    <div>
                      <span
                        className="project-avatar"
                        style={{ background: p.color }}
                      >
                        {p.name
                          .split("-")
                          .map((w) => w[0])
                          .join("")
                          .toUpperCase()}
                      </span>
                      <span className="group-label">{p.group}</span>
                      <ArrowUpRight size={17} />
                    </div>
                    <h2>{p.name}</h2>
                    <p>{p.description}</p>
                    <span className="project-env">
                      <span
                        className={`dot ${p.env === "production" ? "green" : "blue"}`}
                      />
                      {p.env}
                      <span className="language">
                        <i style={{ background: p.color }} />
                        {p.language}
                      </span>
                    </span>
                    <div className="project-meta">
                      <span>
                        <GitCommitHorizontal size={15} />
                        {p.commits} commits
                      </span>
                      <span>
                        <HardDrive size={14} />
                        {p.storage} GB
                      </span>
                      <Avatar name={p.owner} />
                    </div>
                  </button>
                ))}
              </div>
              {!filtered(projects).length && <Empty />}
            </>
          )}

          {page === "activity" && (
            <>
              <div className="activity-hero">
                <div>
                  <span className="eyebrow">BUILT TOGETHER</span>
                  <h2>좋은 코드는, 함께 완성됩니다.</h2>
                  <p>
                    이번 주{" "}
                    <strong>
                      {prScope.reduce((a, p) => a + p.commits, 0)}개의 커밋
                    </strong>
                    이 {prScope.length}개 프로젝트를 앞으로 움직였어요.
                  </p>
                </div>
                <div className="commit-art">
                  <GitBranch size={82} strokeWidth={1} />
                  <span>CODE. REVIEW. SHIP.</span>
                </div>
              </div>
              <div className="two-col">
                <Panel title="팀 기여 현황" eyebrow="THIS WEEK">
                  <div className="leaderboard">
                    {[...prScope]
                      .sort((a, b) => b.commits - a.commits)
                      .map((p, i) => (
                        <div key={p.id}>
                          <span className="rank">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <Avatar name={p.owner} />
                          <span>
                            <strong>{p.owner}</strong>
                            <small>{p.group}</small>
                          </span>
                          <div className="leader-bar">
                            <Progress value={(p.commits / 216) * 100} />
                          </div>
                          <b>{p.commits}</b>
                          <span className="dim">commits</span>
                        </div>
                      ))}
                  </div>
                </Panel>
                <Panel title="리뷰 흐름" eyebrow="MERGE REQUESTS">
                  <div className="mr-summary">
                    {["review", "approved", "merged"].map((s) => (
                      <button key={s} onClick={() => setStatus(s)}>
                        <span className={`dot ${tone[s]}`} />
                        <strong>
                          {scoped(mrs).filter((m) => m.status === s).length}
                        </strong>
                        <span>{labels[s]}</span>
                      </button>
                    ))}
                  </div>
                  <div className="review-note">
                    <GitMerge size={24} />
                    <p>
                      리뷰 대기 MR을 열어 검토를 완료해 보세요.
                      <br />
                      변경된 상태는 이 브라우저에 저장됩니다.
                    </p>
                  </div>
                </Panel>
              </div>
              <Panel
                title="머지 리퀘스트"
                action={
                  <span className="count-pill">
                    {filtered(mrs).length} items
                  </span>
                }
              >
                {filterBar("MR 제목, 프로젝트, 작성자 검색", [
                  "review",
                  "approved",
                  "merged",
                ])}
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>머지 리퀘스트</th>
                        <th>상태</th>
                        <th>작성자</th>
                        <th>변경 파일</th>
                        <th>댓글</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered(mrs).map((m) => (
                        <tr key={m.id} onClick={() => openDetail("mr", m)}>
                          <td>
                            <button
                              className="row-title"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetail("mr", m);
                              }}
                            >
                              <span className="mono dim">!{m.id}</span>
                              <strong>{m.title}</strong>
                            </button>
                            <span className="table-sub">{m.project}</span>
                          </td>
                          <td>
                            <Badge status={m.status} />
                          </td>
                          <td>
                            <span className="person">
                              <Avatar name={m.author} />
                              {m.author}
                            </span>
                          </td>
                          <td>{m.changed} files</td>
                          <td>{m.comments}</td>
                          <td>
                            <ChevronRight size={14} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!filtered(mrs).length && <Empty />}
                </div>
              </Panel>
            </>
          )}

          {page === "security" && (
            <>
              <div className="security-banner">
                <ShieldCheck size={35} strokeWidth={1.4} />
                <div>
                  <span className="eyebrow">SECURITY POSTURE</span>
                  <h2>배포의 자신감은, 안전함에서.</h2>
                  <p>
                    모든 탐지 결과는 시연용이며 실제 CVE 또는 유출 키를 포함하지
                    않습니다.
                  </p>
                </div>
                <span className="demo-tag">SIMULATED FINDINGS</span>
              </div>
              <div className="severity-grid">
                {["critical", "high", "medium", "low"].map((s) => (
                  <button
                    className={`severity-card ${tone[s]}`}
                    key={s}
                    aria-pressed={severity === s}
                    onClick={() => {
                      setQuery("");
                      setStatus("open");
                      setSeverity(severity === s ? "all" : s);
                    }}
                  >
                    <span>
                      <i className={`dot ${tone[s]}`} />
                      {labels[s]}
                    </span>
                    <strong>
                      {fScope
                        .filter((f) => f.severity === s && f.status === "open")
                        .length.toString()
                        .padStart(2, "0")}
                    </strong>
                    <small>미해결 탐지</small>
                  </button>
                ))}
              </div>
              <Panel
                title="탐지 결과"
                eyebrow="VULNERABILITY EXPLORER"
                action={
                  <select
                    aria-label="심각도 필터"
                    className="severity-select"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                  >
                    <option value="all">모든 심각도</option>
                    {["critical", "high", "medium", "low"].map((s) => (
                      <option value={s} key={s}>
                        {labels[s]}
                      </option>
                    ))}
                  </select>
                }
              >
                {filterBar("탐지 제목, 프로젝트 검색", ["open", "resolved"])}
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>보안 탐지</th>
                        <th>심각도</th>
                        <th>프로젝트</th>
                        <th>스캐너</th>
                        <th>처리 상태</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered(findings).map((f) => (
                        <tr key={f.id} onClick={() => openDetail("finding", f)}>
                          <td>
                            <button
                              className="row-title"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetail("finding", f);
                              }}
                            >
                              <strong>{f.title}</strong>
                            </button>
                            <span className="table-sub mono">{f.cve}</span>
                          </td>
                          <td>
                            <Badge status={f.severity} />
                          </td>
                          <td>{f.project}</td>
                          <td className="dim">{f.scanner}</td>
                          <td>
                            <Badge status={f.status} />
                          </td>
                          <td>
                            <ChevronRight size={14} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!filtered(findings).length && <Empty />}
                </div>
              </Panel>
              <Panel title="배포 전 점검" eyebrow="YOUR SECURITY CHECKLIST">
                <div className="checklist">
                  {[
                    "기본 브랜치 보호 및 코드 리뷰 규칙 확인",
                    "관리자 계정 2단계 인증 적용 확인",
                    "보안 스캐너 결과와 미해결 탐지 검토",
                    "백업 복원 절차와 최근 실행 결과 확인",
                  ].map((t, i) => (
                    <label key={t}>
                      <input
                        type="checkbox"
                        checked={checklist.includes(i)}
                        onChange={(e) =>
                          setChecklist((prev) =>
                            e.target.checked
                              ? [...prev, i]
                              : prev.filter((n) => n !== i),
                          )
                        }
                      />
                      <span>{t}</span>
                      <span
                        className={checklist.includes(i) ? "green-text" : "dim"}
                      >
                        {checklist.includes(i) ? "확인 완료" : "확인 필요"}
                      </span>
                    </label>
                  ))}
                </div>
              </Panel>
            </>
          )}

          {page === "storage" && (
            <>
              <div className="storage-hero">
                <div>
                  <span className="eyebrow">STORAGE CAPACITY</span>
                  <h2>더 가볍게, 더 여유롭게.</h2>
                  <p>프로젝트별 저장 공간 사용량을 한눈에 확인하세요.</p>
                  <strong>
                    {prScope.reduce((a, p) => a + p.storage, 0).toFixed(1)}
                    <small>
                      GB <span>/ 1,000 GB 전체 용량</span>
                    </small>
                  </strong>
                  <div
                    className="storage-capacity"
                    aria-label="전체 용량 중 선택 환경 및 다른 환경 사용량"
                  >
                    <span
                      style={{
                        width: `${prScope.reduce((a, p) => a + p.storage, 0) / 10}%`,
                      }}
                    />
                    <span
                      className="other-env"
                      style={{
                        width: `${(projects.reduce((a, p) => a + p.storage, 0) - prScope.reduce((a, p) => a + p.storage, 0)) / 10}%`,
                      }}
                    />
                  </div>
                  <div className="storage-legend">
                    <span>
                      <i className="dot green" />
                      선택 환경 사용량
                    </span>
                    {env !== "all" && (
                      <span>
                        <i className="dot muted" />
                        다른 환경
                      </span>
                    )}
                    <span>
                      {(
                        100 -
                        projects.reduce((a, p) => a + p.storage, 0) / 10
                      ).toFixed(1)}
                      % 전체 여유
                    </span>
                  </div>
                </div>
                <div className="storage-visual">
                  <Database size={108} strokeWidth={0.8} />
                  <span>ROOM TO BUILD.</span>
                </div>
              </div>
              <Panel
                title="프로젝트별 사용량"
                eyebrow="STORAGE BREAKDOWN"
                action={
                  <span className="count-pill">{prScope.length} projects</span>
                }
              >
                <div className="filter-bar">
                  <div className="input-wrap">
                    <Search size={16} />
                    <input
                      aria-label="스토리지 프로젝트 검색"
                      placeholder="프로젝트 이름 검색"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="storage-list">
                  {[...filtered(projects)]
                    .sort((a, b) => b.storage - a.storage)
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => openDetail("project", p)}
                      >
                        <span
                          className="project-avatar"
                          style={{ background: p.color }}
                        >
                          {p.name.slice(0, 2).toUpperCase()}
                        </span>
                        <span>
                          <strong>{p.name}</strong>
                          <small>
                            {p.group} · {p.env}
                          </small>
                        </span>
                        <div className="storage-bar">
                          <Progress
                            value={
                              (p.storage /
                                Math.max(...prScope.map((p) => p.storage))) *
                              100
                            }
                          />
                        </div>
                        <strong className="mono">
                          {p.storage.toFixed(1)} <small>GB</small>
                        </strong>
                        <ArrowUpRight size={15} />
                      </button>
                    ))}
                </div>
                {!filtered(projects).length && <Empty />}
              </Panel>
              <div className="info-strip">
                <HardDrive size={20} />
                <div>
                  <strong>효율적인 공간 관리를 위한 제안</strong>
                  <span>
                    운영 환경에서는 아티팩트 보존 기간과 Container Registry 정리
                    정책을 설정하세요. 이 데모에서는 파일을 삭제하지 않습니다.
                  </span>
                </div>
              </div>
            </>
          )}

          {page === "settings" && (
            <>
              <Panel title="워크스페이스" eyebrow="WORKSPACE DETAILS">
                <div className="settings-list">
                  <div>
                    <span>이름</span>
                    <strong>Acme Engineering</strong>
                  </div>
                  <div>
                    <span>인스턴스</span>
                    <strong>
                      gitlab.example.com{" "}
                      <span className="demo-tag">예시 주소</span>
                    </strong>
                  </div>
                  <div>
                    <span>데이터 모드</span>
                    <strong>
                      <span className="dot green" /> 브라우저 로컬 데모
                    </strong>
                  </div>
                  <div>
                    <span>테마</span>
                    <button
                      className="button"
                      onClick={() =>
                        setTheme(theme === "dark" ? "light" : "dark")
                      }
                    >
                      {theme === "dark" ? (
                        <Sun size={15} />
                      ) : (
                        <Moon size={15} />
                      )}{" "}
                      {theme === "dark"
                        ? "라이트 모드로 전환"
                        : "다크 모드로 전환"}
                    </button>
                  </div>
                </div>
              </Panel>
              <Panel title="데모 데이터" eyebrow="LOCAL PREFERENCES">
                <div className="settings-info">
                  <p>
                    러너 상태, 인시던트 처리, MR 리뷰, 보안 점검과 파이프라인
                    실행은 현재 브라우저에 저장됩니다. 실제 GitLab API나
                    서버에는 연결하지 않습니다.
                  </p>
                  <button
                    className="button danger"
                    onClick={() => setConfirmReset(true)}
                  >
                    <RefreshCw size={15} />
                    데모 초기화
                  </button>
                </div>
              </Panel>
              <Panel title="이 프로젝트에 대해" eyebrow="MADE WITH CODEX">
                <div className="settings-info">
                  <p>
                    InfraDash / Codex는 GitLab 인프라 운영을 위한 독립적인
                    인터랙티브 콘셉트입니다. 기존 InfraDash의 운영 주제를
                    참고하고 디자인과 코드를 새로 만들었습니다.
                  </p>
                  <div className="settings-links">
                    <a
                      href="https://github.com/majitap/infradash-codex"
                      target="_blank"
                      rel="noreferrer"
                    >
                      소스 코드
                      <ArrowUpRight size={15} />
                    </a>
                    <a
                      href="https://majitap.github.io/infradash/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      참고한 InfraDash
                      <ArrowUpRight size={15} />
                    </a>
                  </div>
                </div>
              </Panel>
            </>
          )}

          <footer className="footer">
            <div>
              <span className="footer-symbol">↳</span>
              <span>
                Built for clarity.<strong> InfraDash / Codex</strong>
              </span>
            </div>
            <span>
              실제 시스템에 연결되지 않은 인터랙티브 데모
              <span className="footer-version">v1.0</span>
            </span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
          <button aria-label="메시지 닫기" onClick={() => setToast("")}>
            <X size={15} />
          </button>
        </div>
      )}
      {searchOpen && (
        <div className="modal-backdrop" onClick={() => setSearchOpen(false)}>
          <div
            className="search-dialog"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="빠른 검색"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="search-dialog-input">
              <Search size={21} />
              <input
                aria-label="빠른 검색"
                placeholder="메뉴, 프로젝트, 러너, 인시던트 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchResults.length)
                    searchResults[0].action();
                }}
              />
              <button
                aria-label="검색 닫기"
                onClick={() => setSearchOpen(false)}
              >
                <kbd>ESC</kbd>
              </button>
            </div>
            <div className="search-results">
              <span className="eyebrow">
                {search ? "SEARCH RESULTS" : "빠르게 이동하기"} ·{" "}
                {searchResults.length}
              </span>
              {searchResults.slice(0, 16).map((r, i) => (
                <button key={`${r.kind}-${i}`} onClick={r.action}>
                  <r.Icon size={18} />
                  <span>
                    <strong>{r.title}</strong>
                    <small>{r.subtitle}</small>
                  </span>
                  <span className="search-kind">{r.kind}</span>
                  <ArrowUpRight size={14} />
                </button>
              ))}
              {!searchResults.length && <Empty text="검색 결과가 없습니다." />}
            </div>
            <div className="search-dialog-foot">
              <span>
                <kbd>Tab</kbd> 이동 <kbd>Enter</kbd> 열기
              </span>
              <span>InfraDash command center</span>
            </div>
          </div>
        </div>
      )}
      {detail && item && (
        <div
          className="modal-backdrop drawer-backdrop"
          onClick={() => setDetail(null)}
        >
          <section
            className="detail-drawer"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-top">
              <span className="eyebrow">
                {
                  {
                    pipeline: "PIPELINE DETAILS",
                    runner: "RUNNER CONTROL",
                    incident: "INCIDENT RESPONSE",
                    project: "PROJECT OVERVIEW",
                    finding: "SECURITY FINDING",
                    mr: "MERGE REQUEST",
                  }[detail.type]
                }
              </span>
              <button
                className="icon-button"
                onClick={() => setDetail(null)}
                aria-label="상세 닫기"
              >
                <X size={21} />
              </button>
            </div>
            <div className="drawer-heading">
              <SmallIcon
                icon={
                  {
                    pipeline: Workflow,
                    runner: Server,
                    incident: Radio,
                    project: Layers3,
                    finding: ShieldCheck,
                    mr: GitMerge,
                  }[detail.type]
                }
              />
              <h2 id="detail-title">{detailTitle}</h2>
              {item.status && <Badge status={item.status} />}
            </div>
            <div className="drawer-body">
              {detail.type === "pipeline" && (
                <>
                  <p>
                    {item.project} <span className="mono">#{item.id}</span>
                  </p>
                  <div className="detail-facts">
                    <div>
                      <span>브랜치</span>
                      <strong>
                        <GitBranch size={14} />
                        {item.branch}
                      </strong>
                    </div>
                    <div>
                      <span>커밋</span>
                      <strong className="mono">{item.commit}</strong>
                    </div>
                    <div>
                      <span>실행자</span>
                      <strong>{item.author}</strong>
                    </div>
                    <div>
                      <span>소요 시간</span>
                      <strong>{duration(item.duration)}</strong>
                    </div>
                    <div>
                      <span>환경</span>
                      <strong>{item.env}</strong>
                    </div>
                  </div>
                  <h3>스테이지 진행 상태</h3>
                  <div className="stages">
                    {item.stages.map((s, i) => {
                      const state =
                        item.status === "success"
                          ? "success"
                          : item.status === "failed"
                            ? i === 1
                              ? "failed"
                              : i > 1
                                ? "paused"
                                : "success"
                            : i === 0
                              ? "success"
                              : i === 1
                                ? "running"
                                : "paused";
                      return (
                        <div key={s}>
                          <span className={`stage-icon ${tone[state]}`}>
                            {state === "success" ? (
                              <Check size={16} />
                            ) : state === "failed" ? (
                              <X size={16} />
                            ) : state === "running" ? (
                              <RefreshCw size={15} className="spin" />
                            ) : (
                              <Circle size={14} />
                            )}
                          </span>
                          <strong>{s}</strong>
                          <span>
                            {state === "paused" ? "대기" : labels[state]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="terminal-log">
                    <div>
                      <Terminal size={14} />
                      DEMO JOB OUTPUT
                    </div>
                    <code>
                      {item.status === "failed"
                        ? "$ npm run test\nPASS  unit / validation\nFAIL  integration / order-event\nError: expected event acknowledgement\nJob failed: exit code 1"
                        : item.status === "running"
                          ? "$ git checkout " +
                            item.commit +
                            "\n✓ Build completed\n$ npm run test\nRunning integration tests..."
                          : "$ git checkout " +
                            item.commit +
                            "\n✓ Build completed\n✓ All tests passed\n✓ Security scan completed\n✓ Deployment completed"}
                    </code>
                  </div>
                  {item.status === "running" ? (
                    <button
                      className="button primary full"
                      onClick={() => {
                        setPipelines((rows) =>
                          rows.map((p) =>
                            p.id === item.id
                              ? { ...p, status: "success", duration: 242 }
                              : p,
                          ),
                        );
                        announce("데모 실행이 성공으로 완료되었습니다.");
                      }}
                    >
                      <CheckCheck size={16} />
                      데모 실행 완료하기
                    </button>
                  ) : (
                    <button
                      className="button primary full"
                      onClick={() => retry(item)}
                    >
                      <RefreshCw size={16} />
                      데모 파이프라인 재실행
                    </button>
                  )}
                </>
              )}
              {detail.type === "runner" && (
                <>
                  <p>
                    {item.type} executor · {item.region}
                  </p>
                  <div className="detail-facts">
                    <div>
                      <span>버전</span>
                      <strong>{item.version}</strong>
                    </div>
                    <div>
                      <span>환경</span>
                      <strong>{item.env}</strong>
                    </div>
                    <div>
                      <span>실행 슬롯</span>
                      <strong>
                        {item.used} / {item.slots}
                      </strong>
                    </div>
                    <div>
                      <span>CPU / Memory</span>
                      <strong>
                        {item.cpu}% / {item.memory}%
                      </strong>
                    </div>
                  </div>
                  <h3>리소스 사용량</h3>
                  <div className="resource-detail">
                    <span>
                      CPU <b>{item.cpu}%</b>
                    </span>
                    <Progress value={item.cpu} />
                    <span>
                      MEMORY <b>{item.memory}%</b>
                    </span>
                    <Progress value={item.memory} />
                  </div>
                  <div className="drawer-note">
                    <TriangleAlert size={18} />
                    <p>
                      데모 제어입니다. 변경 사항은 현재 브라우저에만 저장됩니다.
                    </p>
                  </div>
                  <button
                    className="button primary full"
                    onClick={() => {
                      const next =
                        item.status === "online" ? "paused" : "online";
                      setRunners((rows) =>
                        rows.map((r) =>
                          r.id === item.id
                            ? {
                                ...r,
                                status: next,
                                used: 0,
                                cpu: next === "online" ? 12 : 0,
                                memory: next === "online" ? 24 : 12,
                              }
                            : r,
                        ),
                      );
                      announce(
                        `${item.name}: ${labels[next]} 상태로 변경했습니다.`,
                      );
                    }}
                  >
                    {item.status === "online" ? (
                      <Pause size={16} />
                    ) : (
                      <Play size={16} />
                    )}{" "}
                    {item.status === "online"
                      ? "데모 러너 일시중지"
                      : item.status === "offline"
                        ? "데모 러너 복구"
                        : "데모 러너 재개"}
                  </button>
                </>
              )}
              {detail.type === "incident" && (
                <>
                  <p>{item.description}</p>
                  <div className="detail-facts">
                    <div>
                      <span>심각도</span>
                      <strong>{item.severity}</strong>
                    </div>
                    <div>
                      <span>서비스</span>
                      <strong>{item.project}</strong>
                    </div>
                    <div>
                      <span>담당자</span>
                      <strong>{item.owner}</strong>
                    </div>
                    <div>
                      <span>발생 시각</span>
                      <strong>{item.started} KST</strong>
                    </div>
                  </div>
                  <h3>대응 타임라인</h3>
                  <div className="timeline">
                    {item.timeline.map(([time, text], i) => (
                      <div key={i}>
                        <span className="timeline-dot" />
                        <time>{time}</time>
                        <p>{text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="drawer-note">
                    <Radio size={18} />
                    <p>
                      상태 변경은 데모에만 적용됩니다. 실제 알림을 발송하지
                      않습니다.
                    </p>
                  </div>
                  <button
                    className="button primary full"
                    onClick={() => {
                      const next =
                        item.status === "investigating"
                          ? "identified"
                          : item.status === "identified"
                            ? "resolved"
                            : "investigating";
                      const text =
                        next === "identified"
                          ? "원인 확인 · 복구 작업 진행"
                          : next === "resolved"
                            ? "정상화 확인 · 데모 인시던트 종료"
                            : "데모 인시던트 다시 열기";
                      setIncidents((rows) =>
                        rows.map((i) =>
                          i.id === item.id
                            ? {
                                ...i,
                                status: next,
                                timeline: [
                                  ...i.timeline,
                                  [
                                    new Date().toLocaleTimeString("ko-KR", {
                                      timeZone: "Asia/Seoul",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: false,
                                    }),
                                    text,
                                  ],
                                ],
                              }
                            : i,
                        ),
                      );
                      announce(
                        `${item.id}: ${labels[next]} 상태로 변경했습니다.`,
                      );
                    }}
                  >
                    {item.status === "resolved" ? (
                      <RefreshCw size={16} />
                    ) : (
                      <Check size={16} />
                    )}{" "}
                    {item.status === "investigating"
                      ? "원인 확인으로 변경"
                      : item.status === "identified"
                        ? "해결 완료로 변경"
                        : "데모 인시던트 다시 열기"}
                  </button>
                </>
              )}
              {detail.type === "project" && (
                <>
                  <p>{item.description}</p>
                  <div className="detail-facts">
                    <div>
                      <span>그룹</span>
                      <strong>{item.group}</strong>
                    </div>
                    <div>
                      <span>담당자</span>
                      <strong>{item.owner}</strong>
                    </div>
                    <div>
                      <span>주 언어</span>
                      <strong>{item.language}</strong>
                    </div>
                    <div>
                      <span>환경</span>
                      <strong>{item.env}</strong>
                    </div>
                    <div>
                      <span>이번 주 커밋</span>
                      <strong>{item.commits}</strong>
                    </div>
                    <div>
                      <span>스토리지</span>
                      <strong>{item.storage} GB</strong>
                    </div>
                  </div>
                  <h3>
                    서비스 지표 <span className="demo-tag">모의 SLI</span>
                  </h3>
                  <div className="project-slis">
                    <div>
                      <span>가용성 / 30일</span>
                      <strong>
                        {item.availability}
                        <small>%</small>
                      </strong>
                    </div>
                    <div>
                      <span>p95 응답 시간</span>
                      <strong>
                        {item.latency}
                        <small>ms</small>
                      </strong>
                    </div>
                    <div>
                      <span>분당 요청</span>
                      <strong>
                        {(item.requests / 1000).toFixed(1)}
                        <small>k</small>
                      </strong>
                    </div>
                  </div>
                  <h3>최근 파이프라인</h3>
                  {pipelines
                    .filter((p) => p.project === item.name)
                    .slice(0, 3)
                    .map((p) => (
                      <button
                        className="detail-related"
                        key={p.id}
                        onClick={() => openDetail("pipeline", p)}
                      >
                        <span className="mono">#{p.id}</span>
                        <Badge status={p.status} />
                        <ChevronRight size={15} />
                      </button>
                    ))}
                  <button
                    className="button full"
                    onClick={() => {
                      go("pipelines");
                      setQuery(item.name);
                    }}
                  >
                    이 프로젝트의 모든 실행 보기
                    <ArrowRight size={16} />
                  </button>
                </>
              )}
              {detail.type === "finding" && (
                <>
                  <p>{item.description}</p>
                  <div className="detail-facts">
                    <div>
                      <span>탐지 ID</span>
                      <strong>{item.id}</strong>
                    </div>
                    <div>
                      <span>심각도</span>
                      <Badge status={item.severity} />
                    </div>
                    <div>
                      <span>프로젝트</span>
                      <strong>{item.project}</strong>
                    </div>
                    <div>
                      <span>스캐너</span>
                      <strong>{item.scanner}</strong>
                    </div>
                  </div>
                  <div className="drawer-note">
                    <ShieldCheck size={20} />
                    <p>
                      이 항목은 예시 탐지 결과입니다. 실제 취약점이나 비밀
                      정보가 포함되어 있지 않습니다.
                    </p>
                  </div>
                  <h3>권장 처리 절차</h3>
                  <ol className="remediation">
                    <li>영향 범위와 탐지 정확성을 검토합니다.</li>
                    <li>수정 브랜치에서 보완하고 테스트합니다.</li>
                    <li>재검사 후 해결 여부를 확인합니다.</li>
                  </ol>
                  <button
                    className="button primary full"
                    onClick={() => {
                      setFindings((rows) =>
                        rows.map((f) =>
                          f.id === item.id
                            ? {
                                ...f,
                                status:
                                  f.status === "open" ? "resolved" : "open",
                              }
                            : f,
                        ),
                      );
                      announce("데모 보안 탐지 처리 상태를 변경했습니다.");
                    }}
                  >
                    <CheckCircle2 size={16} />
                    {item.status === "open"
                      ? "검토 완료 · 해결됨으로 변경"
                      : "미해결로 다시 열기"}
                  </button>
                </>
              )}
              {detail.type === "mr" && (
                <>
                  <p>
                    {item.project} <span className="mono">!{item.id}</span>
                  </p>
                  <div className="detail-facts">
                    <div>
                      <span>작성자</span>
                      <strong>{item.author}</strong>
                    </div>
                    <div>
                      <span>환경</span>
                      <strong>{item.env}</strong>
                    </div>
                    <div>
                      <span>변경 파일</span>
                      <strong>{item.changed} files</strong>
                    </div>
                    <div>
                      <span>댓글</span>
                      <strong>{item.comments}</strong>
                    </div>
                  </div>
                  <h3>리뷰 요약</h3>
                  <p>
                    이 데모에서는 MR의 검토 상태를 변경할 수 있습니다. 코드
                    변경이나 실제 GitLab 머지는 실행되지 않습니다.
                  </p>
                  <div className="mr-checks">
                    <span>
                      <CheckCircle2 size={17} />
                      단위 테스트 통과
                    </span>
                    <span>
                      <CheckCircle2 size={17} />
                      충돌 없음
                    </span>
                    <span>
                      <CheckCircle2 size={17} />
                      스캐너 실행 완료
                    </span>
                  </div>
                  {item.status !== "merged" ? (
                    <button
                      className="button primary full"
                      onClick={() => {
                        const next =
                          item.status === "review" ? "approved" : "merged";
                        setMrs((rows) =>
                          rows.map((m) =>
                            m.id === item.id ? { ...m, status: next } : m,
                          ),
                        );
                        announce(
                          `MR !${item.id}: ${labels[next]} 상태로 변경했습니다.`,
                        );
                      }}
                    >
                      <GitMerge size={16} />
                      {item.status === "review"
                        ? "데모 리뷰 승인"
                        : "데모 머지 완료"}
                    </button>
                  ) : (
                    <div className="healthy-banner">
                      <CheckCircle2 size={18} />
                      데모 머지가 완료되었습니다.
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="drawer-footer">
              <span className="dot green" />
              LOCAL DEMO <span>변경 사항은 브라우저에 저장됩니다</span>
            </div>
          </section>
        </div>
      )}
      {confirmReset && (
        <div className="modal-backdrop" onClick={() => setConfirmReset(false)}>
          <section
            className="confirm-dialog"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-title"
            onClick={(e) => e.stopPropagation()}
          >
            <RefreshCw size={28} />
            <h2 id="reset-title">데모를 처음으로 되돌릴까요?</h2>
            <p>
              이 브라우저에서 변경한 러너, 인시던트, 보안 상태와 실행 이력이
              초기 예시 데이터로 돌아갑니다.
            </p>
            <div>
              <button className="button" onClick={() => setConfirmReset(false)}>
                취소
              </button>
              <button
                className="button primary"
                onClick={() => {
                  setRunners(initialRunners);
                  setIncidents(initialIncidents);
                  setPipelines(initialPipelines);
                  setFindings(initialFindings);
                  setMrs(initialMR);
                  setChecklist([]);
                  setConfirmReset(false);
                  announce("초기 데모 데이터를 복원했습니다.");
                }}
              >
                초기화
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
