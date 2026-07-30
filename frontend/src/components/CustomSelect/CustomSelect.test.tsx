// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { CustomSelect, type CustomSelectOption } from "./CustomSelect";

const options: CustomSelectOption[] = [
  { value: "available", label: "Доступен" },
  { value: "maintenance", label: "Обслуживание" },
  { value: "offline", label: "Офлайн" }
];

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(cleanup);

describe("CustomSelect", () => {
  it("opens and selects an option", () => {
    const onChange = vi.fn();

    render(
      <CustomSelect
        value="available"
        options={options}
        onChange={onChange}
        ariaLabel="Статус самоката"
      />
    );

    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeTruthy();

    fireEvent.click(screen.getByRole("option", { name: "Офлайн" }));
    expect(onChange).toHaveBeenCalledWith("offline");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("supports keyboard navigation", () => {
    const onChange = vi.fn();

    render(
      <CustomSelect
        value="available"
        options={options}
        onChange={onChange}
        ariaLabel="Статус самоката"
      />
    );

    const trigger = screen.getByRole("combobox");
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith("maintenance");
  });

  it("does not open while disabled", () => {
    render(
      <CustomSelect
        value="available"
        options={options}
        onChange={vi.fn()}
        ariaLabel="Статус самоката"
        disabled
      />
    );

    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
