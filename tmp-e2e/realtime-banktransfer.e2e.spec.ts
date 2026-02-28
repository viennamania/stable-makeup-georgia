import { expect, test } from "playwright/test";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3100";
const FORCE_EMPTY_SYNC = process.env.E2E_FORCE_EMPTY_SYNC === "1";

test("realtime banktransfer receives Ably event even when events API is blocked", async ({ page, request }) => {
  test.setTimeout(180_000);

  const traceId = `e2e-ably-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
  const amount = 700_000 + Math.floor(Math.random() * 90_000);
  const amountText = `${amount.toLocaleString("ko-KR")} KRW`;
  const transactionDate = new Date().toISOString();

  let websocketFrameCount = 0;
  let websocketTraceFrameCount = 0;
  let websocketBankEventFrameCount = 0;
  const websocketFrameSamples: string[] = [];
  let firstAction15Frame = "";
  let channelAttached = false;
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const syncApiResponses: string[] = [];
  let syncApiTraceSeen = false;

  page.on("pageerror", (error) => {
    pageErrors.push(String(error?.message || error));
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("response", async (response) => {
    if (!response.url().includes("/api/realtime/banktransfer/events")) {
      return;
    }
    const status = response.status();
    const text = await response.text().catch(() => "");
    if (text.includes(traceId)) {
      syncApiTraceSeen = true;
    }
    syncApiResponses.push(`status=${status} body=${text.slice(0, 200)}`);
  });

  page.on("websocket", (ws) => {
    ws.on("framereceived", (event) => {
      websocketFrameCount += 1;
      const rawPayload = event.payload as unknown;
      let payload = "";
      if (typeof rawPayload === "string") {
        payload = rawPayload;
      } else if (rawPayload && typeof Buffer !== "undefined" && Buffer.isBuffer(rawPayload)) {
        payload = rawPayload.toString("utf8");
      } else if (rawPayload && typeof rawPayload === "object" && "byteLength" in rawPayload) {
        payload = Buffer.from(rawPayload as ArrayBuffer).toString("utf8");
      } else {
        payload = String(rawPayload || "");
      }

      if (websocketFrameSamples.length < 8) {
        websocketFrameSamples.push(payload.slice(0, 240));
      }
      if (payload.includes("\"action\":11") && payload.includes("\"channel\":\"banktransfer-events\"")) {
        channelAttached = true;
      }
      if (payload.includes("\"action\":15")) {
        websocketBankEventFrameCount += 1;
        if (!firstAction15Frame) {
          firstAction15Frame = payload;
        }
      }
      if (payload.includes(traceId)) {
        websocketTraceFrameCount += 1;
      }
    });
  });

  // Optional isolation mode: keep sync API healthy but return empty data.
  if (FORCE_EMPTY_SYNC) {
    await page.route("**/api/realtime/banktransfer/events**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "success",
          role: "viewer",
          events: [],
          nextCursor: null,
        }),
      });
    });
  }

  await page.goto(`${BASE_URL}/ko/realtime-banktransfer`, { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Banktransfer Realtime Dashboard")).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => channelAttached, { timeout: 20_000 }).toBeTruthy();

  const webhookResponse = await request.post(`${BASE_URL}/api/webhook/banktransfer`, {
    headers: {
      "content-type": "application/json",
      "x-webhook-key": "e2e-test",
      "x-mall-id": "e2e",
      "x-trace-id": traceId,
    },
    data: {
      transaction_type: "deposited",
      bank_account_id: traceId,
      bank_account_number: "02277987999",
      bank_code: "037",
      amount,
      transaction_date: transactionDate,
      transaction_name: `E2E수신${amount}`,
      balance: 1234567,
      processing_date: transactionDate,
    },
  });

  expect(webhookResponse.ok()).toBeTruthy();
  const webhookJson = await webhookResponse.json();
  expect(webhookJson?.status).toBe("success");

  const plainAmountText = amount.toLocaleString("ko-KR");
  await page.waitForTimeout(20_000);
  const amountVisible = await page.getByText(new RegExp(`${plainAmountText}(\\s*KRW)?`)).first().isVisible().catch(() => false);
  const traceFrameReceived = websocketTraceFrameCount > 0;
  const mainText = await page.locator("main").innerText().catch(() => "");
  const traceVisibleInDom = mainText.includes(traceId);

  console.log("traceId=", traceId);
  console.log("amountText=", amountText);
  console.log("websocketFrameCount=", websocketFrameCount);
  console.log("websocketBankEventFrameCount=", websocketBankEventFrameCount);
  console.log("websocketTraceFrameCount=", websocketTraceFrameCount);
  console.log("websocketFrameSamples=", websocketFrameSamples.join(" || "));
  console.log("firstAction15Frame=", firstAction15Frame.slice(0, 1500));
  console.log("amountVisible=", amountVisible);
  console.log("traceVisibleInDom=", traceVisibleInDom);
  console.log("pageErrors=", pageErrors.join(" | "));
  console.log("consoleErrors=", consoleErrors.join(" | "));
  console.log("syncApiResponses=", syncApiResponses.join(" || "));
  console.log("syncApiTraceSeen=", syncApiTraceSeen);
  console.log("mainTextPreview=", mainText.slice(0, 1200));

  if (FORCE_EMPTY_SYNC) {
    expect(syncApiTraceSeen).toBeFalsy();
  }
  expect(traceVisibleInDom).toBeTruthy();
});
