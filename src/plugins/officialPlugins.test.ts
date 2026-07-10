import { afterEach, describe, expect, it } from "bun:test";
import { VemEditorState } from "@vemjs/core";
import {
  createOfficialPluginRegistry,
  officialPlugins,
} from "./officialPlugins";

describe("official Playground plugins", () => {
  afterEach(() => {
    delete (globalThis as unknown as { window?: unknown }).window;
  });

  it("registers every official plugin and exercises their user-visible behavior", async () => {
    (globalThis as unknown as { window: unknown }).window = {};

    const editor = new VemEditorState('const x = "hello"; // comment   ');
    editor.projectFiles = [
      "src/main.ts",
      "src/style.css",
      "packages/core/src/editor.ts",
    ];
    editor.setFileUri("/workspace/src/app.ts");

    const registry = createOfficialPluginRegistry(editor);

    expect(officialPlugins.map((plugin) => plugin.id)).toEqual([
      "autopairs",
      "git",
      "layout-customizer",
      "lualine",
      "telescope",
      "treesitter",
      "trim-whitespace",
    ]);

    editor.handleKey("i");
    editor.handleKey("(");
    expect(editor.getText()).toStartWith("()");

    const highlighted = editor.highlightLine?.('const x = "hello";', 0) ?? [];
    expect(highlighted[0]).toMatchObject({ text: "const", color: "#ff79c6" });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(editor.gutterDecorations.get(0)).toMatchObject({
      type: "add",
      color: "#10b981",
    });

    editor.handleKey("Escape");
    registry.executeCommand("layout.toggleSidebar");
    expect(editor.layoutConfig.sidebarPosition).toBe("right");

    registry.executeCommand("telescope.findFiles");
    expect(editor.activePopup?.title).toBe("Find Files");
    editor.handleKey("m");
    editor.handleKey("a");
    editor.handleKey("i");
    editor.handleKey("n");
    editor.handleKey("Enter");
    expect(editor.fileUri).toBe("src/main.ts");

    registry.executeCommand("telescope.helpTags");
    editor.handleKey("j");
    editor.handleKey("j");
    editor.handleKey("Enter");
    expect(editor.theme.bg).toBe("#282a36");

    expect(editor.statuslineLayout.left[0].text).toBe(" NORMAL ");

    editor.handleKey(":");
    editor.handleKey("w");
    editor.handleKey("Enter");
    expect(editor.getText()).not.toContain("   ");
  });
});
