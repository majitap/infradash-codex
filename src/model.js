export const snapshot = "2026-10-31T14:20:00+09:00";
export const projects = [
  {
    id: 1,
    name: "payment-service",
    group: "commerce",
    env: "production",
    language: "Go",
    owner: "강현우",
    color: "#b5d9ef",
    commits: 142,
    storage: 92.4,
    requests: 12480,
    latency: 284,
    availability: 99.82,
    description: "결제 승인 및 정산 마이크로서비스",
    health: "warning",
  },
  {
    id: 2,
    name: "web-console",
    group: "platform",
    env: "production",
    language: "TypeScript",
    owner: "박하은",
    color: "#b8a5e9",
    commits: 216,
    storage: 78.2,
    requests: 24100,
    latency: 124,
    availability: 99.99,
    description: "고객 및 관리자 웹 콘솔",
    health: "success",
  },
  {
    id: 3,
    name: "gateway-api",
    group: "platform",
    env: "production",
    language: "Go",
    owner: "한재현",
    color: "#e7c48b",
    commits: 98,
    storage: 61.8,
    requests: 48200,
    latency: 42,
    availability: 99.99,
    description: "인증, 라우팅, 트래픽 제어 API 게이트웨이",
    health: "success",
  },
  {
    id: 4,
    name: "auth-service",
    group: "platform",
    env: "production",
    language: "Java",
    owner: "신승우",
    color: "#a6d5ae",
    commits: 87,
    storage: 44.6,
    requests: 8500,
    latency: 86,
    availability: 99.98,
    description: "통합 인증 및 패스키 로그인 서비스",
    health: "success",
  },
  {
    id: 5,
    name: "order-service",
    group: "commerce",
    env: "staging",
    language: "Kotlin",
    owner: "한수아",
    color: "#eaa6a5",
    commits: 104,
    storage: 53.1,
    requests: 1240,
    latency: 164,
    availability: 99.95,
    description: "주문 처리와 재고 이벤트 관리",
    health: "warning",
  },
  {
    id: 6,
    name: "etl-pipelines",
    group: "data",
    env: "staging",
    language: "Python",
    owner: "권지호",
    color: "#aaa5ea",
    commits: 50,
    storage: 203,
    requests: 340,
    latency: 640,
    availability: 99.97,
    description: "분석 데이터 수집 및 변환 파이프라인",
    health: "success",
  },
];
const seeds = [
  93, 105, 88, 121, 98, 72, 65, 116, 124, 108, 132, 118, 77, 69, 125, 138, 126,
  144, 128, 85, 79, 146, 152, 131, 160, 142, 95, 88, 156, 148,
];
export function seriesFor(days, env = "all") {
  const factor = env === "production" ? 0.72 : env === "staging" ? 0.28 : 1;
  return seeds
    .map((n, i) => ({
      date: `10/${i + 2}`,
      success: Math.round(n * factor),
      failed: Math.max(
        1,
        Math.round((i % 5 === 0 ? 12 : i % 3 === 0 ? 8 : 4) * factor),
      ),
    }))
    .slice(-days);
}
export const initialPipelines = Array.from({ length: 30 }, (_, i) => {
  const project = projects[i % projects.length];
  return {
    id: 88420 - i,
    project: project.name,
    env: project.env,
    branch:
      i % 4 === 0 ? "feat/payment-retry" : i % 3 === 0 ? "develop" : "main",
    commit: ["a7f83c2", "4b19e0d", "f9d2a61", "c62b780", "32e1f9a", "8d4ba20"][
      i % 6
    ],
    title: [
      "fix: 결제 재시도 로직 개선",
      "feat: 대시보드 성능 최적화",
      "perf: 커넥션 풀 재사용",
      "feat: WebAuthn 패스키 지원",
      "test: 주문 이벤트 통합 테스트",
      "chore: 데이터 스키마 갱신",
    ][i % 6],
    status:
      i === 0 || i === 8
        ? "running"
        : i === 4 || i === 12 || i === 21
          ? "failed"
          : "success",
    duration: 162 + ((i * 37) % 480),
    author: project.owner,
    time: i * 7 + 2,
    stages: ["build", "test", "security", "deploy"],
  };
});
export const initialRunners = [
  {
    id: 1,
    name: "build-docker-01",
    type: "Docker",
    region: "ap-northeast-2a",
    status: "online",
    cpu: 67,
    memory: 54,
    slots: 8,
    used: 5,
    env: "production",
    version: "17.8.3",
  },
  {
    id: 2,
    name: "build-docker-02",
    type: "Docker",
    region: "ap-northeast-2c",
    status: "online",
    cpu: 42,
    memory: 61,
    slots: 8,
    used: 3,
    env: "production",
    version: "17.8.3",
  },
  {
    id: 3,
    name: "build-docker-03",
    type: "Docker",
    region: "ap-northeast-2a",
    status: "offline",
    cpu: 0,
    memory: 0,
    slots: 8,
    used: 0,
    env: "production",
    version: "17.8.2",
  },
  {
    id: 4,
    name: "k8s-shared-01",
    type: "Kubernetes",
    region: "ap-northeast-2c",
    status: "online",
    cpu: 78,
    memory: 69,
    slots: 12,
    used: 8,
    env: "production",
    version: "17.8.3",
  },
  {
    id: 5,
    name: "deploy-prod",
    type: "Shell",
    region: "ap-northeast-2a",
    status: "paused",
    cpu: 0,
    memory: 12,
    slots: 2,
    used: 0,
    env: "production",
    version: "17.8.3",
  },
  {
    id: 6,
    name: "gpu-runner-01",
    type: "Docker",
    region: "ap-northeast-2c",
    status: "online",
    cpu: 36,
    memory: 48,
    slots: 4,
    used: 1,
    env: "staging",
    version: "17.8.3",
  },
  {
    id: 7,
    name: "e2e-browser-01",
    type: "Docker",
    region: "ap-northeast-2a",
    status: "offline",
    cpu: 0,
    memory: 0,
    slots: 6,
    used: 0,
    env: "staging",
    version: "17.8.2",
  },
  {
    id: 8,
    name: "macos-ios-01",
    type: "Shell",
    region: "on-premise",
    status: "online",
    cpu: 24,
    memory: 38,
    slots: 4,
    used: 1,
    env: "staging",
    version: "17.8.3",
  },
];
export const initialIncidents = [
  {
    id: "INC-241",
    title: "결제 승인 API 응답 지연",
    project: "payment-service",
    env: "production",
    severity: "S1",
    status: "investigating",
    owner: "강현우",
    started: "13:42",
    description:
      "결제 승인 p95 응답 시간이 180ms에서 1.2s로 증가했습니다. DB 커넥션 풀 포화가 의심되어 원인을 조사하고 있습니다.",
    timeline: [
      ["13:42", "지연 시간 임계치 초과 · 자동 탐지"],
      ["13:46", "온콜 강현우 확인 · 원인 조사 시작"],
      ["14:05", "DB 커넥션 풀 점검 · 결제팀 공조"],
    ],
  },
  {
    id: "INC-240",
    title: "E2E 러너 연결 끊김",
    project: "order-service",
    env: "staging",
    severity: "S2",
    status: "identified",
    owner: "한수아",
    started: "12:18",
    description:
      "e2e-browser-01의 네트워크 연결이 끊겨 스테이징 테스트가 대기 중입니다. 노드 네트워크 정책 변경을 확인했습니다.",
    timeline: [
      ["12:18", "러너 heartbeat 응답 없음"],
      ["12:24", "네트워크 정책 변경 확인"],
      ["13:10", "정책 복구 준비 중"],
    ],
  },
  {
    id: "INC-239",
    title: "Registry 스토리지 경고",
    project: "etl-pipelines",
    env: "staging",
    severity: "S3",
    status: "resolved",
    owner: "권지호",
    started: "10:08",
    description:
      "오래된 컨테이너 레이어 정리 후 사용량이 정상 범위로 돌아왔습니다.",
    timeline: [
      ["10:08", "사용량 경고 발생"],
      ["10:32", "미사용 레이어 정리"],
      ["10:46", "정상화 확인 · 종료"],
    ],
  },
];
export const initialFindings = [
  {
    id: "VUL-082",
    title: "컨테이너 베이스 이미지 취약점",
    cve: "DEMO-CVE-001",
    severity: "critical",
    project: "payment-service",
    env: "production",
    scanner: "Container scanning",
    status: "open",
    description:
      "데모 취약점입니다. 베이스 이미지의 보안 패치 적용 여부를 점검하고 이미지를 다시 빌드하세요.",
  },
  {
    id: "VUL-081",
    title: "저장소 내 테스트용 키 패턴 탐지",
    cve: "DEMO-SECRET-002",
    severity: "critical",
    project: "etl-pipelines",
    env: "staging",
    scanner: "Secret detection",
    status: "open",
    description:
      "데모 탐지 결과입니다. 실제 키는 포함되어 있지 않습니다. 실제 운영에서는 노출 키 폐기와 이력 정리가 필요합니다.",
  },
  {
    id: "VUL-080",
    title: "입력값 검증 누락 가능성",
    cve: "DEMO-SAST-003",
    severity: "high",
    project: "gateway-api",
    env: "production",
    scanner: "SAST",
    status: "open",
    description:
      "검색 파라미터의 길이와 허용 문자를 검증하는 규칙을 추가하세요.",
  },
  {
    id: "VUL-079",
    title: "의존성 보안 업데이트 권장",
    cve: "DEMO-DEP-004",
    severity: "medium",
    project: "web-console",
    env: "production",
    scanner: "Dependency scanning",
    status: "open",
    description: "잠금 파일을 갱신하고 회귀 테스트 후 패키지를 업데이트하세요.",
  },
  {
    id: "VUL-078",
    title: "응답 헤더 보안 설정 검토",
    cve: "DEMO-DAST-005",
    severity: "low",
    project: "auth-service",
    env: "production",
    scanner: "DAST",
    status: "resolved",
    description: "Content-Security-Policy 설정이 반영되어 검토를 완료했습니다.",
  },
];
export function filterRows(
  rows,
  { env = "all", status = "all", query = "" } = {},
) {
  const q = query.trim().toLowerCase();
  return rows.filter(
    (r) =>
      (env === "all" || r.env === env) &&
      (status === "all" || r.status === status) &&
      (!q ||
        [r.name, r.title, r.project, r.id, r.author, r.owner, r.branch, r.group]
          .filter((v) => v != null)
          .join(" ")
          .toLowerCase()
          .includes(q)),
  );
}
export function pipelineStats(rows) {
  const completed = rows.filter(
    (r) => r.status === "success" || r.status === "failed",
  );
  return {
    total: rows.length,
    running: rows.filter((r) => r.status === "running").length,
    failed: rows.filter((r) => r.status === "failed").length,
    rate: completed.length
      ? (
          (completed.filter((r) => r.status === "success").length /
            completed.length) *
          100
        ).toFixed(1)
      : "0.0",
    average: completed.length
      ? Math.round(
          completed.reduce((a, r) => a + r.duration, 0) / completed.length,
        )
      : 0,
  };
}
export function csv(rows, keys) {
  const safe = (v) =>
    '"' +
    String(v ?? "")
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  return (
    "\uFEFF" +
    [keys, ...rows.map((row) => keys.map((key) => row[key]))]
      .map((row) => row.map(safe).join(","))
      .join("\r\n")
  );
}
export const duration = (sec) =>
  `${Math.floor(sec / 60)}분 ${String(sec % 60).padStart(2, "0")}초`;
