import "./style.css";

console.log(
  "%cVem — Next-Gen Modal Text Editor",
  "color: #8b5cf6; font-size: 20px; font-weight: bold; text-shadow: 0 2px 10px rgba(139, 92, 246, 0.4);",
);
console.log(
  "%cPowered by VectoUI (WebGL Canvas Engine)",
  "color: #6366f1; font-size: 14px;",
);

// Simple microinteraction: Ripple effect on glass cards
document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("mousemove", (e: Event) => {
    const mouseEvent = e as MouseEvent;
    const rect = (card as HTMLElement).getBoundingClientRect();
    const x = mouseEvent.clientX - rect.left;
    const y = mouseEvent.clientY - rect.top;

    (card as HTMLElement).style.setProperty("--mouse-x", `${x}px`);
    (card as HTMLElement).style.setProperty("--mouse-y", `${y}px`);
  });
});
