import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function PageTransition({ children, tabKey }) {
  var ref = useRef(null);

  useEffect(function () {
    var el = ref.current;
    if (!el) return;

    // Scope selector to within this container only
    var targets = el.querySelectorAll("[data-animate='card'], [data-animate='accordion']");

    // Set initial hidden state explicitly before animating TO final state.
    // Using gsap.set + gsap.to (not gsap.from) ensures cleanup never resets
    // elements back to an invisible state.
    gsap.set(el, { opacity: 0, y: 14 });
    gsap.set(targets, { opacity: 0, y: 18 });

    var t1 = gsap.to(el, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" });
    var t2 = gsap.to(targets, {
      opacity: 1, y: 0, duration: 0.36, stagger: 0.05,
      ease: "power2.out", delay: 0.04,
    });

    return function () {
      // Kill in-progress tweens and clear all inline styles so elements
      // are never left stuck at opacity: 0 between tab switches.
      t1.kill();
      t2.kill();
      gsap.set(el, { clearProps: "all" });
      gsap.set(targets, { clearProps: "all" });
    };
  }, [tabKey]);

  return (
    <div ref={ref}>
      {children}
    </div>
  );
}
