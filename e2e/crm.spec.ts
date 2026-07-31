import { expect, test, type Page } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@samo.local";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "admin123";
const allowMutations = process.env.E2E_ALLOW_MUTATIONS === "true";

async function login(page: Page) {
  await page.goto("/");
  await page.getByLabel("Email").fill(adminEmail);
  await page.getByLabel("Пароль").fill(adminPassword);
  await page.getByRole("button", { name: "Войти" }).click();

  await expect(page).toHaveURL(/\/overview$/);
  await expect(
    page.getByRole("heading", { name: /Добрый день/ }),
  ).toBeVisible();
}

test("открывает страницу входа", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Вход в CRM" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Пароль")).toBeVisible();
});

test("авторизуется и показывает основные показатели", async ({ page }) => {
  await login(page);

  await expect(page.getByText("Активные аренды", { exact: true })).toBeVisible();
  await expect(page.getByText("Средний заряд", { exact: true })).toBeVisible();
  await expect(page.getByText("Статусы самокатов", { exact: true })).toBeVisible();
});

test("сохраняет выбранный раздел после обновления страницы", async ({ page }) => {
  await login(page);

  await page.getByRole("button", { name: "Самокаты" }).click();
  await expect(page).toHaveURL(/\/scooters$/);
  await page.reload();
  await expect(page).toHaveURL(/\/scooters$/);
  await expect(page.getByRole("heading", { name: "Самокаты", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Аренды" }).click();
  await expect(page).toHaveURL(/\/rentals$/);
  await page.reload();
  await expect(page).toHaveURL(/\/rentals$/);
  await expect(page.getByRole("heading", { name: "Аренды", exact: true })).toBeVisible();
});

test("фильтрует самокаты по номеру", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Самокаты" }).click();

  await page.getByPlaceholder("Номер или модель").fill("S-1001");
  await expect(page.getByText("S-1001", { exact: true })).toBeVisible();
  await expect(page.getByText("S-1002", { exact: true })).toHaveCount(0);
});

test("создаёт и удаляет тестовый самокат", async ({ page }) => {
  test.skip(
    !allowMutations,
    "Запускается только при E2E_ALLOW_MUTATIONS=true, так как изменяет данные.",
  );

  const number = `E2E-${Date.now()}`;

  await login(page);

  try {
    await page.getByRole("button", { name: /Добавить самокат/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Новый самокат" })).toBeVisible();

    await page.getByLabel("Номер самоката").fill(number);
    await page.getByLabel("Модель").fill("Playwright Test");
    await page.getByLabel("Уровень заряда, %").fill("75");
    await page.getByLabel("Широта").fill("55.751244");
    await page.getByLabel("Долгота").fill("37.618423");
    await page.getByRole("button", { name: "Добавить", exact: true }).click();

    await page.getByRole("button", { name: "Самокаты" }).click();
    await page.getByPlaceholder("Номер или модель").fill(number);
    await expect(page.getByText(number, { exact: true })).toBeVisible();
    await expect(page.getByText("Playwright Test", { exact: true })).toBeVisible();
  } finally {
    await page.goto("/scooters");
    await page.getByPlaceholder("Номер или модель").fill(number);

    const deleteButton = page.getByRole("button", { name: `Удалить ${number}` });
    if (await deleteButton.isVisible().catch(() => false)) {
      await deleteButton.click();
      await page.getByRole("button", { name: "Удалить", exact: true }).click();
      await expect(page.getByText(number, { exact: true })).toHaveCount(0);
    }
  }
});
