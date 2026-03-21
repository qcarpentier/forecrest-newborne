import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function PageTransition({ children, tabKey, animate }) {
  var ref = useRef(null);

  useEffect(function () {
    var el = ref.current;
    if (!el) return;

    /* Skip GSAP when animations are disabled */
    if (animate === false) return;

    var targets = el.querySelectorAll("[data-animate='card'], [data-animate='accordion']");

    gsap.set(el, { opacity: 0, y: 14 });
    gsap.set(targets, { opacity: 0, y: 18 });

    var t1 = gsap.to(el, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" });
    var t2 = gsap.to(targets, {
      opacity: 1, y: 0, duration: 0.36, stagger: 0.05,
      ease: "power2.out", delay: 0.04,
    });

    return function () {
      t1.kill();
      t2.kill();
      gsap.set(el, { clearProps: "all" });
      gsap.set(targets, { clearProps: "all" });
    };
  }, [tabKey, animate]);

  return (
    <div ref={ref}>
      {children}
    </div>
  );
}
