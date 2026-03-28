import { useState, useEffect } from "react";
import { ShieldCheck, Users, HardDrives } from "@phosphor-icons/react";
import { VERSION } from "../constants/config";
import { useAuth } from "../context/useAuth";
import { getSupabase } from "../lib/supabase";

function Stat({ icon, label, value }) {
  var Icon = icon;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
      {Icon ? <Icon size={13} weight="bold" color="rgba(255,255,255,0.7)" /> : null}
      <span style={{ color: "rgba(255,255,255,0.6)" }}>{label}</span>
      <span style={{ fontWeight: 700, color: "#fff" }}>{value}</span>
    </div>
  );
}

export default function AdminBar() {
  var auth = useAuth();
  var [counts, setCounts] = useState({ users: 0, workspaces: 0 });

  useEffect(function () {
    var sb = getSupabase();
    if (!sb) return;
    Promise.all([
      sb.from("profiles").select("id", { count: "exact", head: true }),
      sb.from("workspaces").select("id", { count: "exact", head: true }),
    ]).then(function (res) {
      setCounts({
        users: (res[0].count != null) ? res[0].count : 0,
        workspaces: (res[1].count != null) ? res[1].count : 0,
      });
    }).catch(function () {});
  }, []);

  return (
    <div style={{
      height: 36, flexShrink: 0,
      background: "linear-gradient(90deg, var(--brand) 0%, var(--brand-gradient-end) 100%)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 var(--sp-4)",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <ShieldCheck size={16} weight="fill" color="#fff" />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>
          Forecrest Admin
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-5)" }}>
        <Stat icon={Users} label="Comptes" value={counts.users} />
        <Stat icon={HardDrives} label="Espaces" value={counts.workspaces} />
        <Stat label="v" value={VERSION} />
      </div>

      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
        {auth.user ? auth.user.email : ""}
      </div>
    </div>
  );
}
