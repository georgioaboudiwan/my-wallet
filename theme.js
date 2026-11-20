(() => {
  let v = "system";
  try { const s = localStorage.getItem("wallet:theme"); if (s === "light" || s === "dark") v = s; } catch { }
  const root = document.documentElement;
  if (v !== "system") {
    root.setAttribute("data-theme", v);
    root.style.colorScheme = v;
    for (const m of document.querySelectorAll('meta[name="theme-color"]')) m.remove();
    const m = document.createElement("meta");
    m.name = "theme-color";
    m.content = v === "dark" ? "#05070f" : "#eef3f8";
    document.head.appendChild(m);
  }
})();
