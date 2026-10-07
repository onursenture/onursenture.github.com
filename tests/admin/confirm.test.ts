import { describe, expect, it, vi } from "vitest";
import { ConfirmState } from "@/lib/admin/confirm";

const leave = { question: "You have unsaved changes. Leave without saving?", confirmLabel: "Leave" };

describe("ConfirmState", () => {
  it("starts with no question", () => {
    expect(new ConfirmState().getSnapshot()).toBeNull();
  });

  it("holds the open question until it is answered", async () => {
    const state = new ConfirmState();
    const answer = state.ask(leave);
    expect(state.getSnapshot()).toEqual(leave);
    state.answer(true);
    expect(await answer).toBe(true);
    expect(state.getSnapshot()).toBeNull();
  });

  it("resolves false when the question is cancelled", async () => {
    const state = new ConfirmState();
    const answer = state.ask(leave);
    state.answer(false);
    expect(await answer).toBe(false);
    expect(state.getSnapshot()).toBeNull();
  });

  it("refuses a second question while one is open and keeps the first", async () => {
    const state = new ConfirmState();
    const first = state.ask(leave);
    expect(await state.ask({ question: "Delete this note?", confirmLabel: "Delete" })).toBe(false);
    expect(state.getSnapshot()).toEqual(leave);
    state.answer(true);
    expect(await first).toBe(true);
  });

  it("takes a new question after the last one was answered", async () => {
    const state = new ConfirmState();
    const first = state.ask(leave);
    state.answer(false);
    await first;
    const second = state.ask({ question: "Delete this note?", confirmLabel: "Delete" });
    expect(state.getSnapshot()?.confirmLabel).toBe("Delete");
    state.answer(true);
    expect(await second).toBe(true);
  });

  it("ignores an answer when nothing is open", () => {
    const state = new ConfirmState();
    const listener = vi.fn();
    state.subscribe(listener);
    state.answer(true);
    expect(listener).not.toHaveBeenCalled();
    expect(state.getSnapshot()).toBeNull();
  });

  it("notifies subscribers on open and answer, with a stable snapshot between", () => {
    const state = new ConfirmState();
    const listener = vi.fn();
    const unsubscribe = state.subscribe(listener);
    void state.ask(leave);
    expect(listener).toHaveBeenCalledTimes(1);
    const open = state.getSnapshot();
    expect(state.getSnapshot()).toBe(open);
    // A refused second question changes nothing, so nobody is told.
    void state.ask({ question: "x", confirmLabel: "y" });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(state.getSnapshot()).toBe(open);
    state.answer(false);
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    void state.ask(leave);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
