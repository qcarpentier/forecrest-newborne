import { useState, useEffect } from "react";
import ThemeContext from "./themeCtx";

export function ThemeProvider({ children }) {
  var [dark, setDark] = useState(function () {
    try {
      return localStorage.getItem("theme") === "dark";
    } catch (e) {
      return false;
    }
  });

  useEffect(function () {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch (e) {}
  }, [dark]);

  function toggle(x, y) {
    var nextDark = !dark;
    var newBg = nextDark ? "#0E0E0D" : "#EDE8DF";
    var ox = x != null ? x : 40;
    var oy = y != null ? y : window.innerHeight - 60;
    var maxR = Math.hypot(
      Math.max(ox, window.innerWidth - ox),
      Math.max(oy, window.innerHeight - oy)
    ) + 40;

    var el = document.createElement("div");
    el.style.position = "fixed";
    el.style.inset = "0";
    el.style.zIndex = "9999";
    el.style.pointerEvents = "none";
    el.style.background = newBg;
    el.style.clipPath = "circle(0px at " + ox + "px " + oy + "px)";
    document.body.appendChild(el);

    requestAnimationFrame(function () { requestAnimationFrame(function () {
      el.style.transition = "clip-path 0.5s cubic-bezier(0.4,0,0.2,1)";
      el.style.clipPath = "circle(" + maxR + "px at " + ox + "px " + oy + "px)";
    }); });

    setTimeout(function () {
      document.documentElement.classList.add("no-transition");
      setDark(nextDark);
      requestAnimationFrame(function () {
        el.remove();
        requestAnimationFrame(function () {
          document.documentElement.classList.remove("no-transition");
        });
      });
    }, 520);
  }

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
