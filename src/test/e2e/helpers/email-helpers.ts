/**
 * Email helpers for E2E testing using Mailtrap API
 */

export interface MailtrapMessage {
  id: number;
  inbox_id: number;
  subject: string;
  sent_at: string;
  from_email: string;
  from_name: string;
  to_email: string;
  to_name: string;
  email_size: number;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  html_body: string;
  text_body: string;
  raw_body: string;
}

export class MailtrapHelper {
  private apiToken: string;
  private accountId: number;
  private inboxId: number;
  private baseUrl = "https://mailtrap.io/api/accounts";

  constructor(apiToken: string, accountId: number, inboxId: number) {
    this.apiToken = apiToken;
    this.accountId = accountId;
    this.inboxId = inboxId;
  }

  /**
   * Get all messages from the inbox
   */
  async getMessages(): Promise<MailtrapMessage[]> {
    const url = `${this.baseUrl}/${this.accountId}/inboxes/${this.inboxId}/messages`;
    // eslint-disable-next-line no-console
    console.log(`📬 Fetching messages from: ${url}`);

    const response = await fetch(url, {
      headers: {
        "Api-Token": this.apiToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      // eslint-disable-next-line no-console
      console.error(`❌ API Error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Mailtrap API error: ${response.status} ${response.statusText}`);
    }

    const messages = await response.json();
    // eslint-disable-next-line no-console
    console.log(`📧 Found ${messages.length} messages in inbox`);

    return messages;
  }

  /**
   * Get a specific message by ID
   */
  async getMessage(messageId: number): Promise<MailtrapMessage> {
    const baseMessageUrl = `${this.baseUrl}/${this.accountId}/inboxes/${this.inboxId}/messages/${messageId}`;

    // Get message metadata
    // eslint-disable-next-line no-console
    console.log(`📩 Fetching message metadata from: ${baseMessageUrl}`);

    const response = await fetch(baseMessageUrl, {
      headers: {
        "Api-Token": this.apiToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      // eslint-disable-next-line no-console
      console.error(`❌ Failed to get message: ${response.status}`, errorText);
      throw new Error(`Mailtrap API error: ${response.status} ${response.statusText}`);
    }

    const message = await response.json();

    // Fetch body content separately
    try {
      // eslint-disable-next-line no-console
      console.log(`📄 Fetching HTML body...`);
      const htmlResponse = await fetch(`${baseMessageUrl}/body.html`, {
        headers: { "Api-Token": this.apiToken },
      });

      if (htmlResponse.ok) {
        message.html_body = await htmlResponse.text();
        // eslint-disable-next-line no-console
        console.log(`✅ Got HTML body: ${message.html_body.length} characters`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("⚠️ Could not fetch HTML body:", error);
    }

    try {
      // eslint-disable-next-line no-console
      console.log(`📄 Fetching text body...`);
      const textResponse = await fetch(`${baseMessageUrl}/body.txt`, {
        headers: { "Api-Token": this.apiToken },
      });

      if (textResponse.ok) {
        message.text_body = await textResponse.text();
        // eslint-disable-next-line no-console
        console.log(`✅ Got text body: ${message.text_body.length} characters`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("⚠️ Could not fetch text body:", error);
    }

    try {
      // eslint-disable-next-line no-console
      console.log(`📄 Fetching raw body...`);
      const rawResponse = await fetch(`${baseMessageUrl}/body.raw`, {
        headers: { "Api-Token": this.apiToken },
      });

      if (rawResponse.ok) {
        message.raw_body = await rawResponse.text();
        // eslint-disable-next-line no-console
        console.log(`✅ Got raw body: ${message.raw_body.length} characters`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("⚠️ Could not fetch raw body:", error);
    }

    return message;
  }

  /**
   * Find the latest email sent to a specific email address
   */
  async findLatestEmailTo(email: string, maxWaitMs = 30000): Promise<MailtrapMessage | null> {
    const startTime = Date.now();
    let attemptCount = 0;

    while (Date.now() - startTime < maxWaitMs) {
      attemptCount++;
      // eslint-disable-next-line no-console
      console.log(`🔄 Attempt ${attemptCount}: Looking for email to ${email}...`);

      const messages = await this.getMessages();

      if (messages.length > 0) {
        // eslint-disable-next-line no-console
        console.log(`📨 Available emails: ${messages.map((m) => `${m.to_email} (${m.subject})`).join(", ")}`);
      }

      // Sort by creation date (newest first)
      const sortedMessages = messages.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Find the latest message for this email
      const targetMessage = sortedMessages.find((msg) => msg.to_email.toLowerCase() === email.toLowerCase());

      if (targetMessage) {
        // eslint-disable-next-line no-console
        console.log(`✅ Found matching email: ${targetMessage.subject} (ID: ${targetMessage.id})`);
        // Get the full message with body content
        return await this.getMessage(targetMessage.id);
      }

      // Wait 2 seconds before trying again
      // eslint-disable-next-line no-console
      console.log(`⏳ No match found, waiting 2s before retry...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return null;
  }

  /**
   * Extract verification link from email content
   */
  extractVerificationLink(message: MailtrapMessage): string | null {
    const content = message.html_body || message.text_body || message.raw_body;

    if (!content) {
      // eslint-disable-next-line no-console
      console.error("❌ Email has no content");
      return null;
    }

    // Common patterns for Supabase verification links
    const patterns = [
      /https?:\/\/[^/\s]+\/auth\/v1\/verify\?[^"\s<>]+/g,
      /https?:\/\/[^/\s]+\/auth\/confirm\?[^"\s<>]+/g,
      /https?:\/\/[^/\s]+\/verify[^"\s<>]*/g,
      /(?:href=["'])(https?:\/\/[^"'\s]+(?:verify|confirm)[^"'\s]*)["']/g,
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        // Clean up the link - remove quotes and HTML entities
        let link = matches[0];

        // If it's from href attribute, extract just the URL
        if (link.includes("href=")) {
          const hrefMatch = link.match(/href=["'](https?:\/\/[^"']+)["']/);
          if (hrefMatch) {
            link = hrefMatch[1];
          }
        }

        // Decode HTML entities
        link = link.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

        return link;
      }
    }

    return null;
  }

  /**
   * Wait for verification email and extract verification link
   */
  async waitForVerificationEmail(email: string, maxWaitMs = 30000): Promise<string | null> {
    // eslint-disable-next-line no-console
    console.log(`🔍 Waiting for verification email to ${email}...`);

    const message = await this.findLatestEmailTo(email, maxWaitMs);

    if (!message) {
      // eslint-disable-next-line no-console
      console.error(`❌ No email found for ${email} within ${maxWaitMs}ms`);
      return null;
    }

    // eslint-disable-next-line no-console
    console.log(`✅ Found email: "${message.subject}" sent at ${message.sent_at}`);

    const verificationLink = this.extractVerificationLink(message);

    if (verificationLink) {
      // eslint-disable-next-line no-console
      console.log(`🔗 Extracted verification link: ${verificationLink.substring(0, 80)}...`);
      return verificationLink;
    } else {
      // eslint-disable-next-line no-console
      console.error("❌ No verification link found in email");
      // eslint-disable-next-line no-console
      console.log(
        "Email content preview:",
        message.html_body?.substring(0, 200) || message.text_body?.substring(0, 200)
      );
      return null;
    }
  }

  /**
   * Clear all messages from the inbox (useful for cleanup)
   */
  async clearInbox(): Promise<void> {
    const messages = await this.getMessages();

    for (const message of messages) {
      await fetch(`${this.baseUrl}/${this.accountId}/inboxes/${this.inboxId}/messages/${message.id}`, {
        method: "DELETE",
        headers: {
          "Api-Token": this.apiToken,
        },
      });
    }

    // eslint-disable-next-line no-console
    console.log(`🗑️ Cleared ${messages.length} messages from inbox`);
  }
}

/**
 * Create a Mailtrap helper instance with environment variables
 */
export function createMailtrapHelper(): MailtrapHelper {
  const apiToken = process.env.MAILTRAP_API_TOKEN;
  const accountId = process.env.MAILTRAP_ACCOUNT_ID;
  const inboxId = process.env.MAILTRAP_INBOX_ID;

  if (!apiToken) {
    throw new Error("MAILTRAP_API_TOKEN environment variable is not set");
  }

  if (!accountId) {
    throw new Error("MAILTRAP_ACCOUNT_ID environment variable is not set");
  }

  if (!inboxId) {
    throw new Error("MAILTRAP_INBOX_ID environment variable is not set");
  }

  const accountIdNumber = parseInt(accountId, 10);
  const inboxIdNumber = parseInt(inboxId, 10);

  if (isNaN(accountIdNumber)) {
    throw new Error("MAILTRAP_ACCOUNT_ID must be a valid number");
  }

  if (isNaN(inboxIdNumber)) {
    throw new Error("MAILTRAP_INBOX_ID must be a valid number");
  }

  return new MailtrapHelper(apiToken, accountIdNumber, inboxIdNumber);
}
