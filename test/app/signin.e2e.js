import { expect, test } from "@playwright/test";
import config from "../../constants/config.js";

// The Expo dev server bundles routes on first navigation.
test.setTimeout(120000);

/**
 * Route glob for the sign-in API endpoint.
 *
 * @type {string}
 */
const SIGNIN_ROUTE = `**${config.api.endpoints.signin}`;

/**
 * Mocking data for the guest sign-in route.
 *
 * @type {{user: {id: string, email: string, role: string}, session: {access_token: string, token_type: string}}}
 */
const GUEST_SESSION = {
  user: {
    id: "e2e-guest",
    email: "guest@paku-paku.official",
    role: "customer"
  },
  session: {
    access_token: "e2e-token",
    token_type: "bearer"
  }
};

/**
 * E2E flows for the reactive sign-in route.
 * @module test/app/signin.e2e
 */

test("validates credentials before sending a sign-in request", async ({ page }) => {
  let requests = 0;

  await page.route(SIGNIN_ROUTE, (route) => {
    requests += 1;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}"
    });
  });

  await page.goto("/signin");

  const email = page.getByPlaceholder("example@email.com");
  const password = page.getByPlaceholder("******");
  const submit = page.getByRole("button", { name: "Sign in" });

  await email.fill("not-an-email");
  await password.fill("secret");
  await submit.click();

  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect(email).toHaveClass(/border-\[#FE2C55\]/);

  await email.fill("guest@example.com");
  await password.fill("");
  await submit.click();

  await expect(page.getByText("Enter your password.")).toBeVisible();
  await expect(email).not.toHaveClass(/border-\[#FE2C55\]/);
  await expect(password).toHaveClass(/border-\[#FE2C55\]/);
  expect(requests).toBe(0);
});

test("shows the server message and restores the button after a failed sign-in", async ({ page }) => {
  await page.route(SIGNIN_ROUTE, (route) => route.fulfill({
    status: 401,
    contentType: "application/json",
    body: JSON.stringify({
      error: {
        code: "invalid_credentials",
        message: "Incorrect email or password."
      }
    })
  }));

  await page.goto("/signin");
  await page.getByPlaceholder("example@email.com").fill("guest@example.com");
  await page.getByPlaceholder("******").fill("wrong");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByText("Incorrect email or password.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
});

test("keeps the guest action busy and redirects after a successful sign-in", async ({ page }) => {
  await page.route(SIGNIN_ROUTE, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(GUEST_SESSION)
    });
  });

  await page.goto("/signin");
  const guest = page.getByRole("button", { name: "Continue as guest" });
  await guest.click();

  await expect(guest).toBeDisabled();
  await expect(page).toHaveURL(/\/menu$/);
});
