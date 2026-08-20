import { TRPCError } from "@trpc/server";

export type NotificationPayload = {
  title: string;
  content: string;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

function validatePayload(input: NotificationPayload): NotificationPayload {
  const title = input.title?.trim();
  const content = input.content?.trim();
  if (!title || !content) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Notification title and content are required." });
  }
  if (title.length > TITLE_MAX_LENGTH || content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Notification payload is too large." });
  }
  return { title, content };
}

/** Sends a JSON notification to an operator-controlled email/webhook adapter. */
export async function notifyOwner(payload: NotificationPayload): Promise<boolean> {
  const validated = validatePayload(payload);
  const endpoint = process.env.NOTIFICATION_PROVIDER_URL;
  if (!endpoint) {
    console.warn("[Notification] No NOTIFICATION_PROVIDER_URL configured; notification skipped.");
    return false;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...(process.env.NOTIFICATION_PROVIDER_TOKEN
          ? { authorization: `Bearer ${process.env.NOTIFICATION_PROVIDER_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        title: validated.title,
        content: validated.content,
        recipient: process.env.RIDEFLOW_ADMIN_EMAIL,
      }),
    });
    if (!response.ok) {
      console.warn(`[Notification] Provider returned ${response.status}.`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Provider request failed:", error);
    return false;
  }
}
