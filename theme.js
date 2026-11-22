(() => {
  let v = "system";
  try { const s = localStorage.getItem("wallet:theme"); if (s === "light" || s === "dark") v = s; } catch { }
  const root = document.documentElement;
  const add = (content, media) => { const m = document.createElement("meta"); m.name = "theme-color"; m.content = content; if (media) m.media = media; document.head.appendChild(m); };
  if (v === "system") { add("#f1f5f0", "(prefers-color-scheme: light)"); add("#040b08", "(prefers-color-scheme: dark)"); return; }
  root.setAttribute("data-theme", v);
  root.style.colorScheme = v;
  add(v === "dark" ? "#040b08" : "#f1f5f0");
})();
