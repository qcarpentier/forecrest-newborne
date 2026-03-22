import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { CaretLeft, CaretRight, CalendarBlank } from "@phosphor-icons/react";
import { useT, useLang } from "../context";

var DAY_NAMES = {
  fr: ["lu", "ma", "me", "je", "ve", "sa", "di"],
  en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
};

var MONTH_NAMES = {
  fr: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

/**
 * Parse "YYYY-MM-DD" → { year, month (0-based), day } or null.
 */
function parseISO(str) {
  if (!str || typeof str !== "string") return null;
  var parts = str.split("-");
  if (parts.length !== 3) return null;
  var y = parseInt(parts[0], 10);
  var m = parseInt(parts[1], 10) - 1;
  var d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return { year: y, month: m, day: d };
}

/**
 * Format { year, month, day } → "YYYY-MM-DD".
 */
function toISO(year, month, day) {
  var mm = String(month + 1);
  if (mm.length < 2) mm = "0" + mm;
  var dd = String(day);
  if (dd.length < 2) dd = "0" + dd;
  return year + "-" + mm + "-" + dd;
}

/**
 * Get number of days in a month.
 */
function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get day of week for 1st of month (0=Mon, 6=Sun — ISO week).
 */
function firstDayOfMonth(year, month) {
  var day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Convert to Mon=0
}

/**
 * Format display string for trigger button.
 */
function formatDisplay(str, lang) {
  var p = parseISO(str);
  if (!p) return "";
  var dd = String(p.day);
  if (dd.length < 2) dd = "0" + dd;
  var mm = String(p.month + 1);
  if (mm.length < 2) mm = "0" + mm;
  return dd + "/" + mm + "/" + p.year;
}

/**
 * Check if two dates are the same day.
 */
function isSameDay(y1, m1, d1, y2, m2, d2) {
  return y1 === y2 && m1 === m2 && d1 === d2;
}

/**
 * Check if a date is today.
 */
function isToday(year, month, day) {
  var now = new Date();
  return year === now.getFullYear() && month === now.getMonth() && day === now.getDate();
}

/**
 * Custom DatePicker component.
 * Replaces native <input type="date"> with a styled calendar dropdown.
 *
 * Props:
 * - value: string "YYYY-MM-DD" or ""
 * - onChange: function(value: string) — called with "YYYY-MM-DD" or ""
 * - placeholder: string (optional)
 * - height: number (optional, default 40)
 * - minDate: string "YYYY-MM-DD" (optional)
 * - maxDate: string "YYYY-MM-DD" (optional)
 */
export default function DatePicker({ value, onChange, placeholder, height, minDate, maxDate }) {
  var t = useT();
  var lang = useLang();
  var lk = lang === "en" ? "en" : "fr";
  var h = height || 40;

  var [open, setOpen] = useState(false);
  var [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  var btnRef = useRef(null);
  var panelRef = useRef(null);

  // View state: which month/year is being displayed
  var parsed = parseISO(value);
  var now = new Date();
  var [viewYear, setViewYear] = useState(parsed ? parsed.year : now.getFullYear());
  var [viewMonth, setViewMonth] = useState(parsed ? parsed.month : now.getMonth());

  // When value changes externally, sync view
  useEffect(function () {
    var p = parseISO(value);
    if (p) {
      setViewYear(p.year);
      setViewMonth(p.month);
    }
  }, [value]);

  var minParsed = parseISO(minDate);
  var maxParsed = parseISO(maxDate);

  function isDisabled(year, month, day) {
    if (minParsed) {
      var minV = minParsed.year * 10000 + minParsed.month * 100 + minParsed.day;
      var curV = year * 10000 + month * 100 + day;
      if (curV < minV) return true;
    }
    if (maxParsed) {
      var maxV = maxParsed.year * 10000 + maxParsed.month * 100 + maxParsed.day;
      var curV2 = year * 10000 + month * 100 + day;
      if (curV2 > maxV) return true;
    }
    return false;
  }

  var updatePos = useCallback(function () {
    if (!btnRef.current) return;
    var rect = btnRef.current.getBoundingClientRect();
    var panelW = 280;
    var panelH = 320;
    var top = rect.bottom + 4;
    var left = rect.left;
    // Ensure panel stays within viewport
    if (left + panelW > window.innerWidth - 8) left = window.innerWidth - panelW - 8;
    if (left < 8) left = 8;
    if (top + panelH > window.innerHeight - 8) top = rect.top - panelH - 4;
    setPos({ top: top, left: left, width: Math.max(rect.width, panelW) });
  }, []);

  function handleToggle() {
    if (!open) updatePos();
    setOpen(function (v) { return !v; });
  }

  // Close on outside click
  useEffect(function () {
    if (!open) return;
    function onClick(e) {
      if (btnRef.current && btnRef.current.contains(e.target)) return;
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      setOpen(false);
    }
    function onScroll() { setOpen(false); }
    document.addEventListener("mousedown", onClick);
    window.addEventListener("scroll", onScroll, true);
    return function () { document.removeEventListener("mousedown", onClick); window.removeEventListener("scroll", onScroll, true); };
  }, [open]);

  // Keyboard nav
  function handleKeyDown(e) {
    if (e.key === "Escape" && open) { setOpen(false); e.stopPropagation(); }
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(function (y) { return y - 1; }); }
    else { setViewMonth(function (m) { return m - 1; }); }
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(function (y) { return y + 1; }); }
    else { setViewMonth(function (m) { return m + 1; }); }
  }

  function selectDay(day) {
    onChange(toISO(viewYear, viewMonth, day));
    setOpen(false);
  }

  function goToday() {
    var now2 = new Date();
    setViewYear(now2.getFullYear());
    setViewMonth(now2.getMonth());
    onChange(toISO(now2.getFullYear(), now2.getMonth(), now2.getDate()));
    setOpen(false);
  }

  function handleClear() {
    onChange("");
    setOpen(false);
  }

  // Build calendar grid
  var totalDays = daysInMonth(viewYear, viewMonth);
  var startOffset = firstDayOfMonth(viewYear, viewMonth);
  var prevMonthDays = viewMonth === 0 ? daysInMonth(viewYear - 1, 11) : daysInMonth(viewYear, viewMonth - 1);

  var cells = [];
  // Previous month trailing days
  for (var i = startOffset - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, current: false, disabled: true });
  }
  // Current month days
  for (var d = 1; d <= totalDays; d++) {
    cells.push({ day: d, current: true, disabled: isDisabled(viewYear, viewMonth, d) });
  }
  // Next month leading days (fill to 42 = 6 rows, or at least complete the last row)
  var remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (var n = 1; n <= remaining; n++) {
      cells.push({ day: n, current: false, disabled: true });
    }
  }

  var displayValue = formatDisplay(value, lk);
  var placeholderText = placeholder || (lk === "fr" ? "jj/mm/aaaa" : "dd/mm/yyyy");

  return (
    <div style={{ position: "relative", width: "100%" }} onKeyDown={handleKeyDown}>
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={handleToggle}
        style={{
          width: "100%", height: h,
          padding: "0 36px 0 var(--sp-3)",
          border: "1px solid " + (open ? "var(--brand)" : "var(--border)"),
          borderRadius: "var(--r-md)",
          background: "var(--input-bg)",
          color: displayValue ? "var(--text-primary)" : "var(--text-muted)",
          fontSize: 14, fontFamily: "inherit", fontWeight: 400,
          cursor: "pointer", outline: "none",
          display: "flex", alignItems: "center",
          textAlign: "left",
          transition: "border-color 0.12s",
          position: "relative",
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayValue || placeholderText}
        </span>
        <CalendarBlank size={14} weight="regular" style={{
          position: "absolute", right: 12,
          color: "var(--text-muted)", opacity: 0.6,
        }} />
      </button>

      {open ? createPortal(
        <div
          ref={panelRef}
          role="dialog"
          aria-label={t.calendar_label || "Calendrier"}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            width: 280,
            zIndex: 1100,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            padding: 0,
            overflow: "hidden",
            animation: "fadeIn 0.12s ease-out",
          }}
        >
          {/* Header: month/year + nav arrows */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 12px 8px",
          }}>
            <button type="button" onClick={prevMonth} aria-label={t.calendar_prev || "Mois précédent"}
              style={{
                width: 28, height: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "none", borderRadius: "var(--r-sm)",
                background: "transparent", cursor: "pointer",
                color: "var(--text-secondary)",
                transition: "background 0.1s",
              }}
              onMouseEnter={function (e) { e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; }}
            >
              <CaretLeft size={14} weight="bold" />
            </button>

            <span style={{
              fontSize: 13, fontWeight: 700,
              color: "var(--text-primary)",
              fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
              userSelect: "none",
            }}>
              {MONTH_NAMES[lk][viewMonth]} {viewYear}
            </span>

            <button type="button" onClick={nextMonth} aria-label={t.calendar_next || "Mois suivant"}
              style={{
                width: 28, height: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "none", borderRadius: "var(--r-sm)",
                background: "transparent", cursor: "pointer",
                color: "var(--text-secondary)",
                transition: "background 0.1s",
              }}
              onMouseEnter={function (e) { e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; }}
            >
              <CaretRight size={14} weight="bold" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
            padding: "0 8px", marginBottom: 4,
          }}>
            {DAY_NAMES[lk].map(function (name) {
              return (
                <div key={name} style={{
                  textAlign: "center", fontSize: 11, fontWeight: 600,
                  color: "var(--text-faint)",
                  padding: "0 0 4px",
                  userSelect: "none",
                }}>
                  {name}
                </div>
              );
            })}
          </div>

          {/* Calendar grid */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
            padding: "0 8px 8px", gap: 2,
          }}>
            {cells.map(function (cell, idx) {
              var isSelected = parsed && cell.current && isSameDay(viewYear, viewMonth, cell.day, parsed.year, parsed.month, parsed.day);
              var isTodayCell = cell.current && isToday(viewYear, viewMonth, cell.day);
              var isOtherMonth = !cell.current;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={cell.disabled}
                  onClick={cell.current && !cell.disabled ? function () { selectDay(cell.day); } : undefined}
                  style={{
                    width: "100%", aspectRatio: "1",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: isTodayCell && !isSelected ? "1px solid var(--brand)" : "1px solid transparent",
                    borderRadius: "var(--r-sm)",
                    background: isSelected ? "var(--brand)" : "transparent",
                    color: isSelected
                      ? "#fff"
                      : isOtherMonth
                        ? "var(--text-faint)"
                        : cell.disabled
                          ? "var(--text-faint)"
                          : "var(--text-primary)",
                    fontSize: 13, fontWeight: isSelected || isTodayCell ? 700 : 400,
                    fontFamily: "'DM Sans', sans-serif",
                    cursor: cell.disabled || isOtherMonth ? "default" : "pointer",
                    outline: "none",
                    transition: "background 0.1s, color 0.1s",
                    opacity: isOtherMonth ? 0.35 : 1,
                  }}
                  onMouseEnter={function (e) {
                    if (!cell.current || cell.disabled || isSelected) return;
                    e.currentTarget.style.background = "var(--bg-hover)";
                  }}
                  onMouseLeave={function (e) {
                    if (!cell.current || cell.disabled || isSelected) return;
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Footer: Today + Clear */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 12px",
            borderTop: "1px solid var(--border-light)",
          }}>
            <button type="button" onClick={handleClear}
              style={{
                border: "none", background: "none",
                color: "var(--text-muted)", fontSize: 12, fontWeight: 500,
                cursor: "pointer", padding: "4px 8px",
                borderRadius: "var(--r-sm)",
                fontFamily: "inherit",
                transition: "color 0.1s",
              }}
              onMouseEnter={function (e) { e.currentTarget.style.color = "var(--color-error)"; }}
              onMouseLeave={function (e) { e.currentTarget.style.color = "var(--text-muted)"; }}
            >
              {t.calendar_clear || "Effacer"}
            </button>
            <button type="button" onClick={goToday}
              style={{
                border: "none", background: "none",
                color: "var(--brand)", fontSize: 12, fontWeight: 600,
                cursor: "pointer", padding: "4px 8px",
                borderRadius: "var(--r-sm)",
                fontFamily: "inherit",
                transition: "opacity 0.1s",
              }}
              onMouseEnter={function (e) { e.currentTarget.style.opacity = "0.7"; }}
              onMouseLeave={function (e) { e.currentTarget.style.opacity = "1"; }}
            >
              {t.calendar_today || "Aujourd'hui"}
            </button>
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
}
