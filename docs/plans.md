## TODO: ICTB-13 add button to check user status (user mode)

1. Add new bot command and menu entry point
    1.1. Extend `MainReplyKeyboardData` (if needed for future UI) or keep as command-only.
    1.2. Register `/my_status` in bot commands list in `src/index.ts`.
    1.3. Route `/my_status` to a new handler in `MessageService` without changing user status.

2. Prepare data contract for user status output
    2.1. Introduce an interface/type (e.g. `UserStatusSnapshot`) to hold counts and settings.
    2.2. Include current `UserStatus`, word count, and interval.
    2.3. Add optional fields for future settings (language, favorites, etc.) with placeholders.

3. Implement status aggregation in MessageService
    3.1. Fetch user dictionary length, current status, and interval.
    3.2. Build `UserStatusSnapshot` and pass it to a formatter helper.
    3.3. Ensure handler works in any user state and does not mutate state.

4. Format output in MarkdownV2
    4.1. Add formatter helper function for the status message.
    4.2. Use list-style bullet points with escaped values.
    4.3. Provide placeholders like "not set" for optional future settings.

5. Verify behavior manually
    5.1. Run `npm run dev`.
    5.2. Check `/my_status` in DEFAULT and non-DEFAULT states.
    5.3. Confirm no status changes and correct formatting.
