## TODO: ICTB-13 add button to check user status (user mode)

1. [x] Add new bot command and menu entry point
    1.1. [x] Extend `MainReplyKeyboardData` (if needed for future UI) or keep as command-only.
    1.2. [x] Register `/my_status` in bot commands list in `src/index.ts`.
    1.3. [x] Route `/my_status` to a new handler in `MessageService` without changing user status.

2. [x] Prepare data contract for user status output
    2.1. [x] Introduce an interface/type (e.g. `UserStatusSnapshot`) to hold counts and settings.
    2.2. [x] Include current `UserStatus`, word count, and interval.
    2.3. [x] Add optional fields for future settings (language, favorites, etc.) with placeholders.

3. [x] Implement status aggregation in MessageService
    3.1. [x] Fetch user dictionary length, current status, and interval.
    3.2. [x] Build `UserStatusSnapshot` and pass it to a formatter helper.
    3.3. [x] Ensure handler works in any user state and does not mutate state.

4. [x] Format output in MarkdownV2
    4.1. [x] Add formatter helper function for the status message.
    4.2. [x] Use list-style bullet points with escaped values.
    4.3. [x] Provide placeholders like "not set" for optional future settings.

5. [x] Verify behavior manually
    5.1. [x] Run `npm run dev`.
    5.2. [x] Check `/my_status` in DEFAULT and non-DEFAULT states.
    5.3. [x] Confirm no status changes and correct formatting.
