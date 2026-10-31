# InfraDash / Codex

GitLab 인프라 운영을 위한 독립적인 인터랙티브 대시보드.

**Live: https://majitap.github.io/infradash-codex/**

기존 [InfraDash](https://majitap.github.io/infradash/)의 운영 주제를 참고해 UI와 코드를 새로 구현했습니다. 밝은 회색 배경과 보라색 강조, 부드러운 라운드를 사용합니다. 장식용 아이콘 박스와 반복적인 정보는 없애고, 화면마다 하나의 주요 작업에 집중하도록 정리했습니다.

## 화면과 동작

- **개요:** 지표 3개, 기간별 실행 차트, 진행 중인 이슈만 표시. 실행 목록은 파이프라인 메뉴에서 확인.
- **파이프라인:** 검색·상태 필터, 8개씩 페이지 이동, 상세 패널에서 단계·로그 확인과 데모 재실행.
- **러너:** CPU·메모리·슬롯, 실행기·리전, 로컬 일시중지·재개·복구.
- **인시던트:** 심각도, 온콜, 대응 타임라인, 조사 → 원인 확인 → 해결 상태 변경.
- **프로젝트:** 그룹·언어·커밋·스토리지, 서비스 상세와 관련 실행 내역.
- **머지 리퀘스트:** 검색·상태 필터, 상세 확인, 데모 승인·머지.
- **보안:** 탐지 결과와 배포 전 점검을 탭으로 구분. 심각도·상태 필터와 해결 처리.
- **스토리지:** 환경별 용량과 프로젝트 사용량.
- **공통:** Ctrl/Cmd+K 검색, 목록별 CSV 내보내기, 라이트·다크 테마, 모바일 메뉴, 키보드 탐색, 데모 초기화.

## 데이터 범위

모든 데이터는 **2026-10-31 KST 기준의 가상 예시**입니다. GitLab API, 서버 또는 비밀 키를 사용하지 않습니다. GitLab 버전과 취약점은 실제 환경에 대한 정보가 아닙니다.

상태 변경은 `localStorage`의 `infradash-v1-*` 키에 저장됩니다. 워크스페이스 설정에서 초기화할 수 있습니다. 파이프라인 시계열은 고정된 일별 모의 집계이며, KPI와 테이블은 최근 실행 표본과 로컬 변경 상태를 사용합니다. 따라서 시계열 집계와 최근 실행 성공률의 모집단이 다릅니다.

실제 운영 데이터를 연결하려면 인증·권한·감사와 비밀 키 저장을 담당하는 별도 서버가 필요합니다. 이 공개 정적 사이트에는 액세스 토큰을 넣지 마세요.

## 로컬 실행

Node.js 24 이상을 권장합니다.

```sh
npm ci
npm run dev
# http://127.0.0.1:5173/infradash-codex/
npm test
npm run build
npm run preview
```

React, Vite, Lucide와 직접 작성한 CSS 차트를 사용합니다. 한글은 Noto Sans KR, 숫자는 Manrope를 Google Fonts에서 불러옵니다. 폰트 로딩 실패 시 시스템 폰트로 표시됩니다.

## 배포

GitHub Pages의 Source를 **GitHub Actions**로 설정합니다. `main`에 푸시하면 `.github/workflows/deploy.yml`에서 의존성 설치, 테스트, 빌드 후 `dist/`를 배포합니다. `vite.config.js`의 base는 `/infradash-codex/`입니다. 해시 라우팅으로 각 메뉴에 직접 접근하고 새로 고침할 수 있습니다.

## 구조

```text
src/Dashboard.jsx    화면 구성, 검색, 필터, 로컬 데모 상태
src/DetailPanel.jsx  상세 정보와 상태 변경
src/ui.jsx           목록, 상태, 페이지 이동 등 공용 컴포넌트
src/Chart.jsx        반응형 실행 추이 차트
src/model.js         모의 데이터, 필터·지표·CSV 함수
src/model.test.js    환경·상태 복합 필터, 지표, 기간, CSV 안전성 검증
src/design.css       테마, 화면 구성, 반응형 스타일
public/favicon.svg   직접 작성한 브랜드 마크
```
