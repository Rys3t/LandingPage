// Run before styles in every entry point; respect saved preferences, otherwise use light.
try {
  document.documentElement.dataset.theme =
    localStorage.getItem("portfolio-theme") === "dark" ? "dark" : "light";
} catch {
  document.documentElement.dataset.theme = "light";
}
