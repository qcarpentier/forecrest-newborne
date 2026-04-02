import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
    extend: {
        theme: {
            text: ["display-xs", "display-sm", "display-md", "display-lg", "display-xl", "display-2xl"],
        },
    },
});

function toClassName(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.map(toClassName).filter(Boolean).join(" ");
    if (typeof value === "object") {
        return Object.entries(value)
            .filter(([, enabled]) => Boolean(enabled))
            .map(([name]) => name)
            .join(" ");
    }

    return "";
}

export function cx(...inputs) {
    return twMerge(inputs.map(toClassName).filter(Boolean).join(" "));
}

export function sortCx(classes) {
    return classes;
}
