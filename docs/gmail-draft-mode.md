# Gmail draft-only setup

This project uses Gmail only to create **unsent drafts**. The application does
not call Gmail's draft-send endpoint, does not schedule automatic follow-ups,
and does not transmit an approved message by itself.

## 1. Create Google OAuth credentials

1. Open Google Cloud Console and create or select a project.
2. Enable the Gmail API for that project.
3. Configure the OAuth consent screen. For a private pilot, keep the app in
   testing and add your Gmail address as a test user.
4. Create an OAuth 2.0 Client ID with application type **Web application**.
5. Add this authorized redirect URI for local development:

   `http://localhost:3000/api/v1/gmail/callback`

## 2. Configure the local application

Add the client ID and secret to `.env.local`:

```env
EMAIL_DELIVERY_MODE=GMAIL_DRAFT
AUTOMATIC_FOLLOWUPS_ENABLED=false
GMAIL_ACCOUNT_EMAIL=your-email@gmail.com
GMAIL_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_OAUTH_CLIENT_SECRET=your-client-secret
GMAIL_OAUTH_REDIRECT_URI=http://localhost:3000/api/v1/gmail/callback
GMAIL_TOKEN_ENCRYPTION_KEY=use-a-long-random-secret-here
```

Never commit `.env.local` or share the OAuth client secret, refresh token, or
encryption key.

## 3. Connect and use Gmail

1. Restart the Next.js development server after changing `.env.local`.
2. Open the **Approval Queue**.
3. Select **Connect Gmail** and approve the requested Gmail compose access.
4. Review and edit a proposal.
5. Select **Approve & Create Gmail Draft**.
6. Open Gmail Drafts, perform a final recipient and content review, and decide
   whether to send it manually.

The OAuth token is encrypted in an HTTP-only, same-site cookie. The configured
`GMAIL_ACCOUNT_EMAIL` prevents accidentally connecting a different account.
Disconnecting Gmail removes the local token cookie. You can also revoke the
application from your Google Account security settings.

## Safety behavior

- Gmail draft mode is the default even when a Resend API key exists.
- Background workers cannot send email unless
  `EMAIL_DELIVERY_MODE=RESEND` is explicitly configured.
- Automatic follow-ups are disabled unless
  `AUTOMATIC_FOLLOWUPS_ENABLED=true` is explicitly configured.
- Approval creates an audit record with the Gmail draft ID and records the
  outreach as approved, not sent.
- Suppressed and Do Not Contact addresses cannot receive a draft.

The Gmail `gmail.compose` OAuth scope can technically manage drafts and send
email. This implementation deliberately calls only `users.drafts.create`.
