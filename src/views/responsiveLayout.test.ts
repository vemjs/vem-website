import { describe, expect, it } from "bun:test";
import { PluginPanel } from "../plugins/PluginPanel";
import { ConfigView } from "./ConfigView";
import { HomeView } from "./HomeView";

describe("VectoJS responsive page layout", () => {
  it("keeps Home page cards within the narrow logical viewport", () => {
    const view = new HomeView(
      390,
      760,
      () => {},
      () => {},
      () => {},
    );

    view.reposition(390, 760);

    const cards = (
      view as unknown as { featureCards: Array<{ width: number }> }
    ).featureCards;
    const flow = (
      view as unknown as { cardsFlow: { x: number; maxWidth: number } }
    ).cardsFlow;

    expect(flow.x).toBe(24);
    expect(flow.maxWidth).toBeLessThanOrEqual(342);
    for (const card of cards) {
      expect(card.width).toBeLessThanOrEqual(342);
    }
  });

  it("stacks Config keybinding controls and preview inside a narrow viewport", () => {
    const view = new ConfigView(390, 760);

    view.reposition(390, 760);

    const internal = view as unknown as {
      keybindings: Array<{
        container: { direction: "horizontal" | "vertical" };
        keysInput: { width: number };
        cmdInput: { width: number };
      }>;
      livePreviewCard: { x: number; y: number; width: number; height: number };
      copyBtn: { x: number; y: number; width: number; height: number };
    };

    const row = internal.keybindings[0];
    expect(row.container.direction).toBe("vertical");
    expect(row.keysInput.width).toBeLessThanOrEqual(342);
    expect(row.cmdInput.width).toBeLessThanOrEqual(342);
    expect(internal.livePreviewCard.x).toBe(24);
    expect(internal.livePreviewCard.width).toBe(342);
    expect(internal.copyBtn.x + internal.copyBtn.width).toBeLessThanOrEqual(
      390,
    );
    expect(internal.copyBtn.y + internal.copyBtn.height).toBeLessThanOrEqual(
      760,
    );
  });

  it("keeps PluginPanel controls in bounds even after hidden-state resize", () => {
    const panel = new PluginPanel(
      360,
      700,
      () => null,
      () => null,
    );

    panel.resize(0, 500);
    expect(
      (panel as unknown as { subtitleText: { maxWidth: number } }).subtitleText
        .maxWidth,
    ).toBe(120);

    panel.resize(320, 500);
    const buttons = (
      panel as unknown as {
        demoButtons: Array<{ x: number; width: number }>;
      }
    ).demoButtons;

    for (const button of buttons) {
      expect(button.x + button.width).toBeLessThanOrEqual(320);
    }
  });
});
