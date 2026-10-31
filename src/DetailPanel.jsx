import React from "react";
import { Check, X } from "lucide-react";
import { Badge, Meter, labels } from "./ui.jsx";
import { duration } from "./model.js";

const titles = {
  pipeline: "파이프라인",
  runner: "러너 상세",
  incident: "인시던트 상세",
  project: "프로젝트 상세",
  finding: "보안 탐지",
  mr: "머지 리퀘스트",
};
export default function DetailPanel({
  type,
  item,
  pipelines,
  setPipelines,
  setRunners,
  setIncidents,
  setFindings,
  setMrs,
  onClose,
  onOpen,
  onProjectRuns,
  notify,
  dialogRef,
}) {
  const changeStatus = (setter, next) => {
    setter((rows) =>
      rows.map((r) => (r.id === item.id ? { ...r, status: next } : r)),
    );
    notify(`${labels[next]} 상태로 변경했습니다.`);
  };
  const facts = {
    pipeline: [
      ["프로젝트", item.project],
      ["브랜치", item.branch],
      ["실행자", item.author],
      ["소요 시간", duration(item.duration || 0)],
    ],
    runner: [
      ["실행기", item.type],
      ["위치", item.region],
      ["버전", item.version],
      ["실행 슬롯", `${item.used} / ${item.slots}`],
    ],
    incident: [
      ["서비스", item.project],
      ["담당자", item.owner],
      ["심각도", item.severity],
      ["발생 시각", `${item.started} KST`],
    ],
    project: [
      ["그룹", item.group],
      ["담당자", item.owner],
      ["주 언어", item.language],
      ["저장 공간", `${item.storage} GB`],
    ],
    finding: [
      ["프로젝트", item.project],
      ["스캐너", item.scanner],
      ["심각도", labels[item.severity]],
      ["탐지 번호", item.id],
    ],
    mr: [
      ["프로젝트", item.project],
      ["작성자", item.author],
      ["변경 파일", `${item.changed}개`],
      ["댓글", `${item.comments}개`],
    ],
  }[type];
  function retry() {
    const next = {
      ...item,
      id: Math.max(...pipelines.map((p) => p.id)) + 1,
      status: "running",
      time: 0,
      duration: 0,
    };
    setPipelines((rows) => [next, ...rows]);
    onOpen("pipeline", next);
    notify(`파이프라인 #${next.id}를 실행했습니다.`);
  }
  return (
    <div className="overlay drawer-overlay" onClick={onClose}>
      <section
        className="drawer"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer-top">
          <span>{titles[type]}</span>
          <button
            className="icon-button"
            aria-label="상세 닫기"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <div className="drawer-content">
          <h2 id="detail-title">{item.name || item.title}</h2>
          {item.status && <Badge status={item.status} />}
          <p className="detail-description">
            {item.description ||
              (type === "pipeline"
                ? `#${item.id} · ${item.project}`
                : type === "mr"
                  ? `!${item.id} · ${item.project}`
                  : item.env)}
          </p>
          <dl className="detail-facts">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          {type === "pipeline" && (
            <>
              <h3>실행 단계</h3>
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
                      <span>{s}</span>
                      <Badge status={state}>
                        {state === "paused" ? "대기" : labels[state]}
                      </Badge>
                    </div>
                  );
                })}
              </div>
              <details className="job-output">
                <summary>작업 로그 보기</summary>
                <pre>
                  {item.status === "failed"
                    ? "$ npm run test\nPASS unit / validation\nFAIL integration / order-event\nJob failed: exit code 1"
                    : item.status === "running"
                      ? "✓ Build completed\nRunning integration tests..."
                      : "✓ Build completed\n✓ Tests passed\n✓ Security scan completed\n✓ Deployment completed"}
                </pre>
              </details>
              <button
                className="button primary full"
                onClick={() => {
                  if (item.status === "running") {
                    setPipelines((rows) =>
                      rows.map((p) =>
                        p.id === item.id
                          ? { ...p, status: "success", duration: 242 }
                          : p,
                      ),
                    );
                    notify("데모 실행이 완료되었습니다.");
                  } else retry();
                }}
              >
                {item.status === "running" ? "데모 실행 완료" : "데모 재실행"}
              </button>
            </>
          )}
          {type === "runner" && (
            <>
              <h3>리소스</h3>
              <div className="resource-row">
                <span>CPU</span>
                <b>{item.cpu}%</b>
              </div>
              <Meter value={item.cpu} />
              <div className="resource-row">
                <span>메모리</span>
                <b>{item.memory}%</b>
              </div>
              <Meter value={item.memory} />
              <button
                className="button primary full"
                onClick={() => {
                  const next = item.status === "online" ? "paused" : "online";
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
                  notify(`${item.name} · ${labels[next]}으로 변경했습니다.`);
                }}
              >
                {item.status === "online"
                  ? "데모 일시중지"
                  : item.status === "offline"
                    ? "데모 러너 복구"
                    : "데모 러너 재개"}
              </button>
            </>
          )}
          {type === "incident" && (
            <>
              <h3>대응 기록</h3>
              <ol className="timeline">
                {item.timeline.map(([time, text], i) => (
                  <li key={i}>
                    <time>{time}</time>
                    <p>{text}</p>
                  </li>
                ))}
              </ol>
              <button
                className="button primary full"
                onClick={() => {
                  const next =
                    item.status === "investigating"
                      ? "identified"
                      : item.status === "identified"
                        ? "resolved"
                        : "investigating";
                  setIncidents((rows) =>
                    rows.map((r) =>
                      r.id === item.id
                        ? {
                            ...r,
                            status: next,
                            timeline: [
                              ...r.timeline,
                              [
                                new Date().toLocaleTimeString("ko-KR", {
                                  timeZone: "Asia/Seoul",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                }),
                                next === "resolved"
                                  ? "정상화 확인 · 해결 완료"
                                  : next === "identified"
                                    ? "원인 확인 · 복구 진행"
                                    : "데모 인시던트 다시 열기",
                              ],
                            ],
                          }
                        : r,
                    ),
                  );
                  notify(`${item.id} · ${labels[next]}으로 변경했습니다.`);
                }}
              >
                {item.status === "investigating"
                  ? "원인 확인으로 변경"
                  : item.status === "identified"
                    ? "해결 완료로 변경"
                    : "데모 인시던트 다시 열기"}
              </button>
            </>
          )}
          {type === "project" && (
            <>
              <h3>서비스 지표</h3>
              <div className="service-facts">
                <div>
                  <span>30일 가용성</span>
                  <b>{item.availability}%</b>
                </div>
                <div>
                  <span>p95 응답 시간</span>
                  <b>{item.latency} ms</b>
                </div>
              </div>
              <h3>최근 실행</h3>
              {pipelines
                .filter((p) => p.project === item.name)
                .slice(0, 3)
                .map((p) => (
                  <button
                    className="related-run"
                    key={p.id}
                    onClick={() => onOpen("pipeline", p)}
                  >
                    <span>#{p.id}</span>
                    <Badge status={p.status} />
                  </button>
                ))}
              <button
                className="button full"
                onClick={() => onProjectRuns(item.name)}
              >
                이 프로젝트의 모든 실행 보기
              </button>
            </>
          )}
          {type === "finding" && (
            <>
              <h3>검토 순서</h3>
              <ol className="review-steps">
                <li>탐지 결과와 영향 범위를 확인합니다.</li>
                <li>수정 후 테스트와 보안 검사를 실행합니다.</li>
                <li>재검사 결과를 확인하고 처리합니다.</li>
              </ol>
              <button
                className="button primary full"
                onClick={() =>
                  changeStatus(
                    setFindings,
                    item.status === "open" ? "resolved" : "open",
                  )
                }
              >
                {item.status === "open"
                  ? "검토 완료 · 해결됨으로 변경"
                  : "미해결로 다시 열기"}
              </button>
            </>
          )}
          {type === "mr" && (
            <>
              <h3>검토 상태</h3>
              <div className="review-checks">
                <span>
                  <Check size={16} />
                  테스트 통과
                </span>
                <span>
                  <Check size={16} />
                  머지 충돌 없음
                </span>
              </div>
              {item.status !== "merged" ? (
                <button
                  className="button primary full"
                  onClick={() =>
                    changeStatus(
                      setMrs,
                      item.status === "review" ? "approved" : "merged",
                    )
                  }
                >
                  {item.status === "review"
                    ? "데모 리뷰 승인"
                    : "데모 머지 완료"}
                </button>
              ) : (
                <p className="resolved-note">머지가 완료되었습니다.</p>
              )}
            </>
          )}
        </div>
        <footer className="drawer-footer">
          데모 변경 사항은 이 브라우저에만 저장됩니다.
        </footer>
      </section>
    </div>
  );
}
