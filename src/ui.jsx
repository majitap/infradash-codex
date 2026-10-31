import React, { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Search, X } from "lucide-react";

export const labels = {
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
  review: "리뷰 대기",
  approved: "승인됨",
  merged: "머지됨",
};
const colors = {
  success: "green",
  online: "green",
  resolved: "green",
  approved: "green",
  failed: "red",
  offline: "muted",
  critical: "red",
  investigating: "orange",
  identified: "orange",
  open: "orange",
  high: "orange",
  medium: "muted",
  low: "muted",
  paused: "muted",
  running: "purple",
  review: "purple",
  merged: "muted",
};
export function useSaved(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem(`infradash-v1-${key}`));
      return Array.isArray(v) ? v : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(`infradash-v1-${key}`, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue];
}
export function Badge({ status, children }) {
  return (
    <span className={`badge ${colors[status] || "muted"}`}>
      <i />
      {children || labels[status] || status}
    </span>
  );
}
export function Avatar({ name }) {
  return (
    <span className="avatar" aria-hidden="true">
      {name?.slice(-2)}
    </span>
  );
}
export function Empty({ text = "검색 결과가 없습니다." }) {
  return (
    <div className="empty">
      <strong>{text}</strong>
      <p>검색어나 필터를 변경해 보세요.</p>
    </div>
  );
}
export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function TextLink({ children = "전체 보기", onClick }) {
  return (
    <button className="text-link" onClick={onClick}>
      {children}
      <ArrowRight size={14} />
    </button>
  );
}
export function Meter({ value }) {
  return (
    <div className="meter">
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
export function SearchInput({ value, onChange, placeholder = "검색", label }) {
  return (
    <div className="search-input">
      <Search size={16} />
      <input
        aria-label={label || placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button aria-label="검색 지우기" onClick={() => onChange("")}>
          <X size={14} />
        </button>
      )}
    </div>
  );
}
export function Segments({ value, onChange, options, label = "보기 선택" }) {
  return (
    <div className="segments" aria-label={label}>
      {options.map(([id, title]) => (
        <button
          aria-pressed={value === id}
          className={value === id ? "selected" : ""}
          key={id}
          onClick={() => onChange(id)}
        >
          {title}
        </button>
      ))}
    </div>
  );
}
export function Paged({ rows, children, pageSize = 8 }) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize)),
    current = Math.min(page, pages - 1),
    signature = rows.map((r) => r.id).join(",");
  useEffect(() => setPage(0), [signature]);
  return (
    <>
      {children(rows.slice(current * pageSize, (current + 1) * pageSize))}
      {rows.length > 0 && (
        <div className="pagination">
          <span>
            {rows.length}개 중 {current * pageSize + 1}–
            {Math.min(rows.length, (current + 1) * pageSize)}
          </span>
          <div>
            <button
              aria-label="이전 페이지"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              {current + 1} / {pages}
            </span>
            <button
              aria-label="다음 페이지"
              disabled={current === pages - 1}
              onClick={() => setPage(current + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
