import React, { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ChevronRight,
  Database,
  GitMerge,
  LayoutGrid,
  Layers,
  Menu,
  Moon,
  Radio,
  RefreshCw,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Sun,
  Workflow,
  X,
  Check,
} from "lucide-react";
import {
  projects,
  initialPipelines,
  initialRunners,
  initialIncidents,
  initialFindings,
  filterRows,
  pipelineStats,
  duration,
  csv,
} from "./model.js";
import {
  Avatar,
  Badge,
  Empty,
  Meter,
  Paged,
  Panel,
  SearchInput,
  Segments,
  TextLink,
  labels,
  useSaved,
} from "./ui.jsx";
import DetailPanel from "./DetailPanel.jsx";
import ExecutionChart from "./Chart.jsx";

const navigation = [
  ["overview", "개요", LayoutGrid],
  ["pipelines", "파이프라인", Workflow],
  ["runners", "러너", Server],
  ["incidents", "인시던트", Radio],
  ["projects", "프로젝트", Layers],
  ["activity", "머지 리퀘스트", GitMerge],
  ["security", "보안", ShieldCheck],
  ["storage", "스토리지", Database],
];
const descriptions = {
  overview: "오늘 확인할 GitLab 운영 현황입니다.",
  pipelines: "최근 실행을 확인하고, 필요한 작업을 다시 실행하세요.",
  runners: "러너의 연결 상태와 실행 여유를 확인하세요.",
  incidents: "진행 중인 이슈를 확인하고 대응 기록을 남기세요.",
  projects: "팀에서 운영하는 프로젝트를 모았습니다.",
  activity: "리뷰를 기다리는 변경 사항을 확인하세요.",
  security: "탐지 결과를 검토하고 배포 전 점검을 완료하세요.",
  storage: "프로젝트별 저장 공간 사용량을 확인하세요.",
  settings: "화면과 데모 데이터를 관리합니다.",
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
const route = () => {
  const key = location.hash.slice(1);
  return navigation.some((n) => n[0] === key) || key === "settings"
    ? key
    : "overview";
};
const safeTheme = () => {
  try {
    return localStorage.getItem("infradash-theme-v2") || "light";
  } catch {
    return "light";
  }
};
const clock = () =>
  new Date().toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });

function RunsTable({ rows, onOpen, compact = false }) {
  return rows.length ? (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>프로젝트 / 실행</th>
            {!compact && <th>브랜치</th>}
            <th>상태</th>
            <th>소요 시간</th>
            <th aria-label="상세" />
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} onClick={() => onOpen("pipeline", p)}>
              <td>
                <button
                  className="row-title"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen("pipeline", p);
                  }}
                >
                  {p.project}
                </button>
                <span className="row-sub">
                  #{p.id} · {p.time === 0 ? "방금 전" : `${p.time}분 전`}
                </span>
              </td>
              {!compact && (
                <td>
                  <span className="branch">{p.branch}</span>
                </td>
              )}
              <td>
                <Badge status={p.status} />
              </td>
              <td className="time-cell">{duration(p.duration)}</td>
              <td>
                <ChevronRight size={15} />
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

export default function Dashboard() {
  const [page, setPage] = useState(route),
    [env, setEnv] = useState("all"),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState("all"),
    [severity, setSeverity] = useState("all"),
    [securityTab, setSecurityTab] = useState("findings"),
    [incidentTab, setIncidentTab] = useState("active");
  const [pipelines, setPipelines] = useSaved("pipelines", initialPipelines),
    [runners, setRunners] = useSaved("runners", initialRunners),
    [incidents, setIncidents] = useSaved("incidents", initialIncidents),
    [findings, setFindings] = useSaved("findings", initialFindings),
    [mrs, setMrs] = useSaved("mrs", initialMR),
    [checklist, setChecklist] = useSaved("checklist", []);
  const [theme, setTheme] = useState(safeTheme),
    [menuOpen, setMenuOpen] = useState(false),
    [searchOpen, setSearchOpen] = useState(false),
    [search, setSearch] = useState(""),
    [detail, setDetail] = useState(null),
    [resetOpen, setResetOpen] = useState(false),
    [toast, setToast] = useState(""),
    [updated, setUpdated] = useState("14:20");
  const pageRef = useRef(page),
    dialogRef = useRef(null),
    opener = useRef(null),
    toastTimer = useRef(null),
    mobileMenuButton = useRef(null);
  const notify = (message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3500);
  };
  const clearFilters = () => {
    setQuery("");
    setStatus("all");
    setSeverity("all");
  };
  function go(next) {
    pageRef.current = next;
    location.hash = next;
    setPage(next);
    clearFilters();
    setMenuOpen(false);
    setSearchOpen(false);
    setDetail(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  const open = (type, item) => {
    setSearchOpen(false);
    setDetail({ type, id: item.id });
  };
  const scoped = (rows) => filterRows(rows, { env });
  const filtered = (rows) => filterRows(rows, { env, status, query });
  const projectScope = scoped(projects),
    pipelineScope = scoped(pipelines),
    runnerScope = scoped(runners),
    incidentScope = scoped(incidents),
    findingScope = scoped(findings),
    mrScope = scoped(mrs),
    activeIncidents = incidentScope.filter((i) => i.status !== "resolved"),
    stats = pipelineStats(pipelineScope);
  const incidentRows = filtered(incidents).filter((i) =>
    incidentTab === "active"
      ? i.status !== "resolved"
      : i.status === "resolved",
  );
  const findingRows = filtered(findings).filter(
    (f) => severity === "all" || f.severity === severity,
  );
  const totalStorage = projects.reduce((a, p) => a + p.storage, 0),
    selectedStorage = projectScope.reduce((a, p) => a + p.storage, 0);
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
      ).find((r) => r.id === detail.id)
    : null;
  const modalOpen = searchOpen || !!item || resetOpen;
  useEffect(() => {
    const fn = () => {
      const next = route();
      if (pageRef.current !== next) {
        clearFilters();
        setDetail(null);
        setMenuOpen(false);
      }
      pageRef.current = next;
      setPage(next);
    };
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("infradash-theme-v2", theme);
    } catch {}
  }, [theme]);
  useEffect(() => {
    document.title = `${navigation.find((n) => n[0] === page)?.[1] || "설정"} · InfraDash`;
  }, [page]);
  useEffect(() => {
    const fn = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setDetail(null);
        setSearch("");
        setSearchOpen((s) => !s);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setDetail(null);
        setResetOpen(false);
        if (menuOpen) {
          setMenuOpen(false);
          mobileMenuButton.current?.focus();
        }
      }
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [menuOpen]);
  useEffect(() => {
    if (!modalOpen) return;
    opener.current = document.activeElement;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() =>
      dialogRef.current?.querySelector("input,button")?.focus(),
    );
    const trap = (e) => {
      if (e.key !== "Tab") return;
      const focusable = [
        ...(dialogRef.current?.querySelectorAll(
          'button:not(:disabled),input,select,a[href],summary,[tabindex="0"]',
        ) || []),
      ].filter((el) => el.getClientRects().length);
      if (!focusable.length) return;
      if (e.shiftKey && document.activeElement === focusable[0]) {
        e.preventDefault();
        focusable.at(-1).focus();
      } else if (!e.shiftKey && document.activeElement === focusable.at(-1)) {
        e.preventDefault();
        focusable[0].focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", trap);
      opener.current?.focus?.();
    };
  }, [modalOpen, searchOpen, detail?.type, resetOpen]);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  function exportRows() {
    const rows =
      {
        overview: pipelineScope.slice(0, 4),
        pipelines: filtered(pipelines),
        runners: filtered(runners),
        incidents: incidentRows,
        projects: filtered(projects),
        activity: filtered(mrs),
        security: findingRows,
        storage: filtered(projects),
      }[page] || [];
    const keys = rows.length
      ? Object.keys(rows[0]).filter(
          (k) => !["timeline", "stages", "description"].includes(k),
        )
      : ["id", "status"];
    const url = URL.createObjectURL(
      new Blob([csv(rows, keys)], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `infradash-${page}-${env}-2026-10-31.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify(`${rows.length}개 항목을 CSV로 내보냈습니다.`);
  }
  const exportButton = (
    <button className="button subtle export" onClick={exportRows}>
      <ArrowDownToLine size={15} />
      <span>CSV 내보내기</span>
    </button>
  );
  const stateSelect = (options) => (
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
  );
  const searchResults = [
    ...navigation.map(([id, title, Icon]) => ({
      kind: "메뉴",
      title,
      subtitle: "",
      Icon,
      action: () => go(id),
    })),
    ...projectScope.map((p) => ({
      kind: "프로젝트",
      title: p.name,
      subtitle: p.group,
      action: () => open("project", p),
    })),
    ...runnerScope.map((r) => ({
      kind: "러너",
      title: r.name,
      subtitle: labels[r.status],
      action: () => open("runner", r),
    })),
    ...incidentScope.map((i) => ({
      kind: "인시던트",
      title: i.title,
      subtitle: i.id,
      action: () => open("incident", i),
    })),
  ].filter((r) =>
    (r.title + " " + r.subtitle).toLowerCase().includes(search.toLowerCase()),
  );
  const title = navigation.find((n) => n[0] === page)?.[1] || "설정";

  return (
    <>
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
      <div className="app-frame" inert={modalOpen ? true : undefined}>
        {menuOpen && (
          <button
            className="menu-scrim"
            aria-label="메뉴 닫기"
            onClick={() => setMenuOpen(false)}
          />
        )}
        <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
          <a
            className="brand"
            href="#overview"
            onClick={(e) => {
              e.preventDefault();
              go("overview");
            }}
          >
            infra<span>dash</span>
            <i />
          </a>
          <div className="sidebar-label">운영</div>
          <nav aria-label="주 메뉴">
            {navigation.map(([id, label, Icon], index) => (
              <React.Fragment key={id}>
                {index === 4 && (
                  <div className="sidebar-label resources">관리</div>
                )}
                <a
                  href={`#${id}`}
                  className={`nav-link ${page === id ? "active" : ""}`}
                  aria-current={page === id ? "page" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    go(id);
                  }}
                >
                  <Icon size={18} strokeWidth={1.65} />
                  <span>{label}</span>
                  {id === "incidents" &&
                    incidents.some((i) => i.status !== "resolved") && (
                      <small>
                        {
                          incidents.filter((i) => i.status !== "resolved")
                            .length
                        }
                      </small>
                    )}
                </a>
              </React.Fragment>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="instance">
              <i />
              GitLab 데모<small>실제 서버 연결 없음</small>
            </div>
            <button
              className={`nav-link ${page === "settings" ? "active" : ""}`}
              onClick={() => go("settings")}
            >
              <Settings size={18} strokeWidth={1.65} />
              설정
            </button>
            <button
              className="nav-link"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? (
                <Moon size={18} strokeWidth={1.65} />
              ) : (
                <Sun size={18} strokeWidth={1.65} />
              )}
              <span>{theme === "light" ? "다크 모드" : "라이트 모드"}</span>
            </button>
          </div>
        </aside>
        <div className="workspace">
          <header className="topbar">
            <button
              ref={mobileMenuButton}
              className="icon-button mobile-menu"
              aria-label="메뉴 열기"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={21} />
            </button>
            <div className="workspace-name">
              Acme <span>Engineering</span>
            </div>
            <button
              className="global-search"
              aria-label="빠른 검색 열기"
              onClick={() => {
                setSearch("");
                setSearchOpen(true);
              }}
            >
              <Search size={17} />
              <span>메뉴와 프로젝트 검색</span>
              <kbd>Ctrl K</kbd>
            </button>
            <div className="profile">
              <Avatar name="김인프라" />
              <div>
                <strong>김인프라</strong>
                <span>관리자</span>
              </div>
            </div>
          </header>
          <main id="main-content" tabIndex={-1}>
            <div className="page-heading">
              <div>
                <h1>{title}</h1>
                <p>{descriptions[page]}</p>
              </div>
              {page !== "settings" && (
                <div className="page-actions">
                  <span className="date-label">2026. 10. 31.</span>
                  <select
                    aria-label="환경 선택"
                    value={env}
                    onChange={(e) => {
                      setEnv(e.target.value);
                      clearFilters();
                    }}
                  >
                    <option value="all">전체 환경</option>
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                  </select>
                </div>
              )}
            </div>

            {page === "overview" && (
              <>
                <div className="metrics">
                  <button
                    className="metric featured"
                    onClick={() => go("pipelines")}
                  >
                    <span>파이프라인 성공률</span>
                    <strong>
                      {stats.rate}
                      <small>%</small>
                    </strong>
                    <p>
                      최근 완료된{" "}
                      {
                        pipelineScope.filter((p) => p.status !== "running")
                          .length
                      }
                      회 기준
                    </p>
                  </button>
                  <button className="metric" onClick={() => go("runners")}>
                    <span>사용 가능한 러너</span>
                    <strong>
                      {runnerScope.filter((r) => r.status === "online").length}
                      <small>/ {runnerScope.length}</small>
                    </strong>
                    <p>
                      {runnerScope.filter((r) => r.status === "offline").length}
                      대 오프라인 ·{" "}
                      {runnerScope.filter((r) => r.status === "paused").length}
                      대 일시중지
                    </p>
                  </button>
                  <button className="metric" onClick={() => go("incidents")}>
                    <span>진행 중인 인시던트</span>
                    <strong>
                      {activeIncidents.length}
                      <small>건</small>
                    </strong>
                    <p>
                      {activeIncidents.length
                        ? "확인과 대응이 필요합니다"
                        : "모든 이슈가 해결되었습니다"}
                    </p>
                  </button>
                </div>
                <div className="overview-grid">
                  <ExecutionChart env={env} />
                  <Panel
                    title="확인이 필요한 이슈"
                    action={
                      <span className="plain-count">
                        {activeIncidents.length}건
                      </span>
                    }
                    className="issues-panel"
                  >
                    <div className="issue-previews">
                      {activeIncidents.slice(0, 2).map((i) => (
                        <button key={i.id} onClick={() => open("incident", i)}>
                          <div>
                            <span
                              className={`severity-text ${i.severity.toLowerCase()}`}
                            >
                              {i.severity}
                            </span>
                            <span>{i.project}</span>
                          </div>
                          <h3>{i.title}</h3>
                          <p>
                            {labels[i.status]}
                            <span>{i.owner}</span>
                          </p>
                        </button>
                      ))}
                      {!activeIncidents.length && (
                        <div className="all-clear">
                          <strong>진행 중인 이슈가 없어요.</strong>
                          <p>새로운 이슈가 생기면 여기에 표시됩니다.</p>
                        </div>
                      )}
                    </div>
                    <div className="panel-bottom">
                      <TextLink onClick={() => go("incidents")}>
                        인시던트 보기
                      </TextLink>
                    </div>
                  </Panel>
                </div>
              </>
            )}

            {page === "pipelines" && (
              <Panel
                title="실행 목록"
                description={`${stats.total}회 실행 · 평균 ${duration(stats.average)}`}
                action={exportButton}
              >
                <div className="table-toolbar">
                  <Segments
                    value={status}
                    onChange={setStatus}
                    options={[
                      ["all", "전체"],
                      ["running", "실행 중"],
                      ["failed", "실패"],
                      ["success", "성공"],
                    ]}
                    label="파이프라인 상태"
                  />
                  <SearchInput
                    value={query}
                    onChange={setQuery}
                    placeholder="프로젝트 또는 브랜치 검색"
                  />
                </div>
                <Paged rows={filtered(pipelines)}>
                  {(rows) => <RunsTable rows={rows} onOpen={open} />}
                </Paged>
              </Panel>
            )}

            {page === "runners" && (
              <>
                <div className="standalone-toolbar">
                  <SearchInput
                    value={query}
                    onChange={setQuery}
                    placeholder="러너 이름 검색"
                  />
                  {stateSelect(["online", "offline", "paused"])}
                </div>
                <div className="runner-grid">
                  {filtered(runners).map((r) => (
                    <button
                      className="runner-card"
                      key={r.id}
                      onClick={() => open("runner", r)}
                    >
                      <div className="card-title">
                        <h2>{r.name}</h2>
                        <Badge status={r.status} />
                      </div>
                      <p>
                        {r.type} · {r.region}
                      </p>
                      <div className="resource-row">
                        <span>CPU 사용량</span>
                        <b>{r.cpu}%</b>
                      </div>
                      <Meter value={r.cpu} />
                      <div className="runner-card-bottom">
                        <span>
                          {r.used} / {r.slots} 슬롯 사용
                        </span>
                        <span>
                          상세 보기
                          <ChevronRight size={14} />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                {!filtered(runners).length && <Empty />}
              </>
            )}

            {page === "incidents" && (
              <Panel
                title="인시던트"
                description="오늘의 온콜 · 강현우"
                action={exportButton}
              >
                <div className="table-toolbar">
                  <Segments
                    value={incidentTab}
                    onChange={setIncidentTab}
                    options={[
                      ["active", `진행 중 ${activeIncidents.length}`],
                      ["resolved", "해결됨"],
                    ]}
                    label="인시던트 보기"
                  />
                  <SearchInput
                    value={query}
                    onChange={setQuery}
                    placeholder="제목 또는 서비스 검색"
                  />
                </div>
                <div className="incident-list">
                  {incidentRows.map((i) => (
                    <button
                      key={i.id}
                      className="incident-row"
                      onClick={() => open("incident", i)}
                    >
                      <span
                        className={`severity-text ${i.severity.toLowerCase()}`}
                      >
                        {i.severity}
                      </span>
                      <div>
                        <h3>{i.title}</h3>
                        <p>
                          {i.id} · {i.project} · {i.started} 발생
                        </p>
                      </div>
                      <Badge status={i.status} />
                      <span className="incident-person">
                        <Avatar name={i.owner} />
                        {i.owner}
                      </span>
                      <ChevronRight size={16} />
                    </button>
                  ))}
                </div>
                {!incidentRows.length && (
                  <Empty text="표시할 인시던트가 없습니다." />
                )}
              </Panel>
            )}

            {page === "projects" && (
              <Panel
                title={`프로젝트 ${projectScope.length}개`}
                action={exportButton}
              >
                <div className="table-toolbar">
                  <SearchInput
                    value={query}
                    onChange={setQuery}
                    placeholder="프로젝트, 그룹, 담당자 검색"
                  />
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>프로젝트</th>
                        <th>언어</th>
                        <th>담당자</th>
                        <th>이번 주 커밋</th>
                        <th aria-label="상세" />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered(projects).map((p) => (
                        <tr key={p.id} onClick={() => open("project", p)}>
                          <td>
                            <button
                              className="row-title"
                              onClick={(e) => {
                                e.stopPropagation();
                                open("project", p);
                              }}
                            >
                              {p.name}
                            </button>
                            <span className="row-sub">
                              {p.group} · {p.env}
                            </span>
                          </td>
                          <td>{p.language}</td>
                          <td>
                            <span className="person">
                              <Avatar name={p.owner} />
                              {p.owner}
                            </span>
                          </td>
                          <td className="numeric">{p.commits}</td>
                          <td>
                            <ChevronRight size={15} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!filtered(projects).length && <Empty />}
                </div>
              </Panel>
            )}

            {page === "activity" && (
              <Panel
                title="머지 리퀘스트"
                description={`${mrScope.filter((m) => m.status === "review").length}건이 리뷰를 기다리고 있습니다.`}
                action={exportButton}
              >
                <div className="table-toolbar">
                  <SearchInput
                    value={query}
                    onChange={setQuery}
                    placeholder="제목, 프로젝트, 작성자 검색"
                  />
                  {stateSelect(["review", "approved", "merged"])}
                </div>
                <div className="mr-list">
                  {filtered(mrs).map((m) => (
                    <button
                      className="mr-row"
                      key={m.id}
                      onClick={() => open("mr", m)}
                    >
                      <div>
                        <h3>{m.title}</h3>
                        <p>
                          !{m.id} · {m.project} · {m.author}
                        </p>
                      </div>
                      <Badge status={m.status} />
                      <ChevronRight size={16} />
                    </button>
                  ))}
                </div>
                {!filtered(mrs).length && <Empty />}
              </Panel>
            )}

            {page === "security" && (
              <>
                <div className="section-tabs">
                  <button
                    aria-pressed={securityTab === "findings"}
                    className={securityTab === "findings" ? "active" : ""}
                    onClick={() => setSecurityTab("findings")}
                  >
                    탐지 결과
                    <span>
                      {findingScope.filter((f) => f.status === "open").length}
                    </span>
                  </button>
                  <button
                    aria-pressed={securityTab === "checklist"}
                    className={securityTab === "checklist" ? "active" : ""}
                    onClick={() => setSecurityTab("checklist")}
                  >
                    배포 전 점검
                  </button>
                </div>
                {securityTab === "findings" ? (
                  <Panel title="보안 탐지" action={exportButton}>
                    <div className="table-toolbar security-toolbar">
                      <SearchInput
                        value={query}
                        onChange={setQuery}
                        placeholder="제목 또는 프로젝트 검색"
                      />
                      <div className="select-group">
                        <select
                          aria-label="심각도 필터"
                          value={severity}
                          onChange={(e) => setSeverity(e.target.value)}
                        >
                          <option value="all">모든 심각도</option>
                          {["critical", "high", "medium", "low"].map((s) => (
                            <option key={s} value={s}>
                              {labels[s]}
                            </option>
                          ))}
                        </select>
                        {stateSelect(["open", "resolved"])}
                      </div>
                    </div>
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>탐지 내용</th>
                            <th>심각도</th>
                            <th>상태</th>
                            <th aria-label="상세" />
                          </tr>
                        </thead>
                        <tbody>
                          {findingRows.map((f) => (
                            <tr key={f.id} onClick={() => open("finding", f)}>
                              <td>
                                <button
                                  className="row-title"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    open("finding", f);
                                  }}
                                >
                                  {f.title}
                                </button>
                                <span className="row-sub">
                                  {f.project} · {f.scanner}
                                </span>
                              </td>
                              <td>
                                <Badge status={f.severity} />
                              </td>
                              <td>
                                <Badge status={f.status} />
                              </td>
                              <td>
                                <ChevronRight size={15} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {!findingRows.length && <Empty />}
                    </div>
                  </Panel>
                ) : (
                  <Panel
                    title="배포 전 점검"
                    description={`${checklist.length} / 4개 확인 완료`}
                  >
                    <div className="checklist">
                      {[
                        "기본 브랜치 보호와 코드 리뷰 규칙 확인",
                        "관리자 계정 2단계 인증 확인",
                        "미해결 보안 탐지 결과 검토",
                        "백업 복원 절차와 최근 실행 결과 확인",
                      ].map((text, i) => (
                        <label key={text}>
                          <input
                            type="checkbox"
                            checked={checklist.includes(i)}
                            onChange={(e) =>
                              setChecklist((rows) =>
                                e.target.checked
                                  ? [...rows, i]
                                  : rows.filter((n) => n !== i),
                              )
                            }
                          />
                          <span>{text}</span>
                          {checklist.includes(i) && <Check size={17} />}
                        </label>
                      ))}
                    </div>
                  </Panel>
                )}
              </>
            )}

            {page === "storage" && (
              <>
                <section className="storage-summary">
                  <div className="storage-title">
                    <div>
                      <h2>저장 공간</h2>
                      <p>
                        {env === "all" ? "전체 프로젝트" : "선택한 환경"} 사용량
                      </p>
                    </div>
                    <strong>
                      {selectedStorage.toFixed(1)}
                      <small>GB</small>
                    </strong>
                  </div>
                  <div
                    className="capacity-track"
                    aria-label={`전체 사용량 ${totalStorage.toFixed(1)}GB / 1000GB`}
                  >
                    <span style={{ width: `${selectedStorage / 10}%` }} />
                    <span
                      className="other-capacity"
                      style={{
                        width: `${(totalStorage - selectedStorage) / 10}%`,
                      }}
                    />
                  </div>
                  <div className="storage-caption">
                    <span>
                      전체 용량 1,000 GB
                      {env !== "all" && " · 회색은 다른 환경 사용량"}
                    </span>
                    <span>남은 공간 {(1000 - totalStorage).toFixed(1)} GB</span>
                  </div>
                </section>
                <Panel title="프로젝트별 사용량" action={exportButton}>
                  <div className="table-toolbar">
                    <SearchInput
                      value={query}
                      onChange={setQuery}
                      placeholder="프로젝트 이름 검색"
                    />
                  </div>
                  <div className="storage-list">
                    {[...filtered(projects)]
                      .sort((a, b) => b.storage - a.storage)
                      .map((p) => (
                        <button key={p.id} onClick={() => open("project", p)}>
                          <div>
                            <strong>{p.name}</strong>
                            <span>{p.group}</span>
                          </div>
                          <Meter
                            value={
                              (p.storage /
                                Math.max(
                                  ...projectScope.map((p) => p.storage),
                                )) *
                              100
                            }
                          />
                          <b>
                            {p.storage.toFixed(1)}
                            <small>GB</small>
                          </b>
                          <ChevronRight size={15} />
                        </button>
                      ))}
                  </div>
                  {!filtered(projects).length && <Empty />}
                </Panel>
              </>
            )}

            {page === "settings" && (
              <>
                <Panel title="워크스페이스">
                  <dl className="settings-list">
                    <div>
                      <dt>이름</dt>
                      <dd>Acme Engineering</dd>
                    </div>
                    <div>
                      <dt>연결 방식</dt>
                      <dd>모의 데이터 · API 연결 없음</dd>
                    </div>
                    <div>
                      <dt>화면 테마</dt>
                      <dd>
                        <Segments
                          value={theme}
                          onChange={setTheme}
                          options={[
                            ["light", "라이트"],
                            ["dark", "다크"],
                          ]}
                          label="화면 테마"
                        />
                      </dd>
                    </div>
                  </dl>
                </Panel>
                <Panel title="데모 데이터">
                  <div className="settings-content">
                    <p>
                      변경한 상태는 현재 브라우저에 저장됩니다. 초기화하면 처음
                      제공된 예시 데이터로 돌아갑니다.
                    </p>
                    <button
                      className="button"
                      onClick={() => setResetOpen(true)}
                    >
                      데모 초기화
                    </button>
                  </div>
                </Panel>
                <div className="about-links">
                  <a
                    href="https://github.com/majitap/infradash-codex"
                    target="_blank"
                    rel="noreferrer"
                  >
                    소스 코드
                  </a>
                  <a
                    href="https://majitap.github.io/infradash/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    처음 참고한 InfraDash
                  </a>
                </div>
              </>
            )}

            <footer className="page-footer">
              <span>모의 데이터 · 실제 GitLab과 연결되지 않은 데모입니다.</span>
              <button
                onClick={() => {
                  setUpdated(clock());
                  notify("브라우저에 저장된 데모 상태를 확인했습니다.");
                }}
                aria-label="데모 상태 새로고침"
              >
                <RefreshCw size={12} />
                {updated} 기준
              </button>
            </footer>
          </main>
        </div>
      </div>
      {toast && (
        <div className="toast" role="status">
          <span>{toast}</span>
          <button aria-label="메시지 닫기" onClick={() => setToast("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {item && (
        <DetailPanel
          type={detail.type}
          item={item}
          pipelines={pipelines}
          setPipelines={setPipelines}
          setRunners={setRunners}
          setIncidents={setIncidents}
          setFindings={setFindings}
          setMrs={setMrs}
          onClose={() => setDetail(null)}
          onOpen={open}
          onProjectRuns={(name) => {
            go("pipelines");
            setQuery(name);
          }}
          notify={notify}
          dialogRef={dialogRef}
        />
      )}
      {searchOpen && (
        <div className="overlay" onClick={() => setSearchOpen(false)}>
          <section
            className="search-dialog"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="빠른 검색"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="search-dialog-top">
              <Search size={20} />
              <input
                aria-label="빠른 검색"
                placeholder="메뉴, 프로젝트, 러너 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchResults.length)
                    searchResults[0].action();
                }}
              />
              <button
                className="icon-button"
                aria-label="검색 닫기"
                onClick={() => setSearchOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="search-results">
              <p>{search ? "검색 결과" : "바로 이동"}</p>
              {searchResults.slice(0, 16).map((r, i) => (
                <button key={`${r.kind}-${i}`} onClick={r.action}>
                  <div>
                    <strong>{r.title}</strong>
                    {r.subtitle && <span>{r.subtitle}</span>}
                  </div>
                  <small>{r.kind}</small>
                  <ChevronRight size={15} />
                </button>
              ))}
              {!searchResults.length && <Empty />}
            </div>
            <div className="search-tip">
              Tab으로 이동 · Enter로 열기 · Esc로 닫기
            </div>
          </section>
        </div>
      )}
      {resetOpen && (
        <div className="overlay" onClick={() => setResetOpen(false)}>
          <section
            className="reset-dialog"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="reset-title">데모를 초기화할까요?</h2>
            <p>
              이 브라우저에서 변경한 실행 이력과 처리 상태가 초기 예시 데이터로
              돌아갑니다.
            </p>
            <div>
              <button className="button" onClick={() => setResetOpen(false)}>
                취소
              </button>
              <button
                className="button primary"
                onClick={() => {
                  setPipelines(initialPipelines);
                  setRunners(initialRunners);
                  setIncidents(initialIncidents);
                  setFindings(initialFindings);
                  setMrs(initialMR);
                  setChecklist([]);
                  setResetOpen(false);
                  notify("데모 데이터를 초기화했습니다.");
                }}
              >
                초기화
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
