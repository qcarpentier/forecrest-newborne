import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { CaretDown } from "@phosphor-icons/react";
import Avatar from "./Avatar";
import { Badge } from "../components";
import { useT } from "../context";

export default function AvatarGroup({ members, max, onViewAll, tabLabels, currentTab, currentUserId }) {
  var t = useT();
  var ct = t.collab || {};
  var limit = max || 3;
  var [open, setOpen] = useState(false);
  var triggerRef = useRef(null);
  var [pos, setPos] = useState({ top: 0, right: 0 });

  var visible = members.slice(0, limit);
  var overflow = members.length - limit;

  /* ── Position dropdown ── */
  useEffect(function () {
    if (!open || !triggerRef.current) return;
    var rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
  }, [open]);

  /* ── Close on click outside ── */
  useEffect(function () {
    if (!open) return;
    function handleClick(e) {
      if (triggerRef.current && triggerRef.current.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return function () { document.removeEventListener("mousedown", handleClick); };
  }, [open]);

  function getPageLabel(page) {
    if (!page) return "";
    if (tabLabels && tabLabels[page]) return tabLabels[page];
    return page;
  }

  return (
    <div
      ref={triggerRef}
      onClick={function () { setOpen(function (v) { return !v; }); }}
      style={{
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        gap: 0,
        position: "relative",
        padding: "4px 8px 4px 6px",
        borderRadius: "var(--r-full)",
        border: "1px solid var(--border-light)",
        background: open ? "var(--bg-hover)" : "transparent",
        transition: "background 0.12s, border-color 0.12s",
      }}
      onMouseEnter={function (e) { if (!open) e.currentTarget.style.background = "var(--bg-hover)"; }}
      onMouseLeave={function (e) { if (!open) e.currentTarget.style.background = "transparent"; }}
    >
      {/* Stacked avatars */}
      {visible.map(function (m, i) {
        return (
          <div key={m.userId} style={{
            marginLeft: i === 0 ? 0 : -6,
            zIndex: limit - i,
            position: "relative",
            opacity: m.idle ? 0.45 : 1,
            transition: "opacity 0.3s",
          }}>
            <Avatar
              name={m.displayName}
              userId={m.userId}
              size={24}
              color={m.color}
              online={m.online}
              showStatus={true}
            />
          </div>
        );
      })}

      {/* Overflow count */}
      {overflow > 0 ? (
        <span style={{
          marginLeft: 4,
          fontSize: 11,
          fontWeight: 700,
          color: "var(--text-faint)",
        }}>
          +{overflow}
        </span>
      ) : null}

      {members.length > 0 ? (
        <CaretDown size={12} weight="bold" color="var(--text-faint)" style={{ marginLeft: 8 }} />
      ) : null}

      {/* Dropdown portal */}
      {open && members.length > 0 ? createPortal(
        <div style={{
          position: "fixed",
          top: pos.top,
          right: pos.right,
          zIndex: 200,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--shadow-dropdown)",
          minWidth: 260,
          maxWidth: "calc(100vw - 16px)",
          maxHeight: members.length > 5 ? 340 : "auto",
          overflowY: members.length > 5 ? "auto" : "visible",
          padding: "var(--sp-2)",
          animation: "tooltipIn 0.1s ease",
        }}>
          {/* Header */}
          <div style={{
            padding: "var(--sp-2) var(--sp-3)",
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}>
            {members.length} {members.length > 1 ? (ct.members_plural || "membres") : (ct.member_singular || "membre")}
          </div>

          {/* Member list */}
          {members.map(function (m) {
            /* For current user, use local currentTab (instant) instead of Realtime (delayed) */
            var memberPage = (currentUserId && m.userId === currentUserId) ? currentTab : m.currentPage;
            var samePage = currentTab && memberPage === currentTab;
            return (
              <div key={m.userId} style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--sp-3)",
                padding: "var(--sp-2) var(--sp-3)",
                borderRadius: "var(--r-md)",
                background: samePage ? "var(--brand-bg, rgba(232,67,26,0.04))" : "transparent",
              }}>
                <Avatar
                  name={m.displayName}
                  userId={m.userId}
                  size={24}
                  color={m.color}
                  online={m.online}
                  showStatus={true}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: samePage ? 600 : 500,
                    color: m.idle ? "var(--text-faint)" : "var(--text-primary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--sp-1)",
                  }}>
                    {m.displayName || "\u2014"}
                    {m.idle ? <span style={{ fontSize: 10, color: "var(--text-ghost)", fontWeight: 400 }}>{"\u00b7"} {ct.idle || "inactif"}</span> : null}
                  </div>
                </div>
                {memberPage ? (
                  <Badge color={samePage ? "brand" : "gray"} size="sm">{getPageLabel(memberPage)}</Badge>
                ) : null}
              </div>
            );
          })}

          {/* View all button */}
          {onViewAll ? (
            <button
              onMouseDown={function (e) {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
                onViewAll();
              }}
              style={{
                display: "block",
                width: "100%",
                padding: "var(--sp-2) var(--sp-3)",
                marginTop: "var(--sp-1)",
                border: "none",
                borderTop: "1px solid var(--border-light)",
                background: "transparent",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--brand)",
                textAlign: "center",
                borderRadius: "0 0 var(--r-md) var(--r-md)",
              }}
            >
              {ct.view_all || "Voir tout"}
            </button>
          ) : null}
        </div>,
        document.body
      ) : null}
    </div>
  );
}
