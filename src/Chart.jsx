import React, { useState } from "react";
import { seriesFor } from "./model.js";
import { Panel, Segments } from "./ui.jsx";

export default function ExecutionChart({ env }) {
  const [days, setDays] = useState(7),
    [hover, setHover] = useState(null),
    data = seriesFor(days, env),
    total = data.reduce((a, d) => a + d.success + d.failed, 0);
  return (
    <Panel
      title="파이프라인 추이"
      description={`${total.toLocaleString()}회 실행 · 일별 집계`}
      action={
        <Segments
          label="차트 기간"
          value={days}
          onChange={(d) => {
            setDays(d);
            setHover(null);
          }}
          options={[
            [7, "7일"],
            [14, "14일"],
          ]}
        />
      }
      className="chart-panel"
    >
      <div
        className="bar-chart"
        role="group"
        aria-label={`${days}일간 파이프라인 실행 추이`}
      >
        <div className="chart-scale" aria-hidden="true">
          <span>200</span>
          <span>100</span>
          <span>0</span>
        </div>
        <div className="chart-lines" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="bar-columns">
          {data.map((d, i) => (
            <button
              key={d.date}
              aria-label={`${d.date} 성공 ${d.success}건, 실패 ${d.failed}건`}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={() => setHover(hover === i ? null : i)}
            >
              <span className="bar-track">
                <span
                  className={`bar-fill ${hover === i ? "hover" : ""}`}
                  style={{ height: `${(d.success + d.failed) / 2}%` }}
                >
                  <i />
                </span>
              </span>
              <span className="bar-date">
                {days === 7 || i % 2 === 0 || i === data.length - 1
                  ? d.date
                  : "\u00a0"}
              </span>
            </button>
          ))}
        </div>
        {hover !== null && (
          <div
            className="chart-tooltip"
            style={{
              left: `${Math.min(73, Math.max(6, (hover / data.length) * 88))}%`,
            }}
          >
            <b>{data[hover].date}</b>
            <span>
              성공 {data[hover].success} · 실패 {data[hover].failed}
            </span>
          </div>
        )}
      </div>
      <div className="chart-caption">
        <span>
          <i className="legend-dot" />
          전체 실행
        </span>
        <span>2026년 10월 · 모의 데이터</span>
      </div>
    </Panel>
  );
}
