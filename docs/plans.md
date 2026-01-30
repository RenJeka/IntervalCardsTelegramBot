# detailed step-by-step TODO plan for ICTB-46

- [x] Create `src/services/log.service.ts`
    - [x] Implement `safeStringify` helper function to limit depth (max 3 levels) and handle circular references.
    - [x] Create `LogService` class with static methods: `error`, `warn`, `info`, `debug`.
    - [x] Ensure `error` method uses `safeStringify` for the error object/details.
- [x] Refactor `src/index.ts` to use `LogService`.
- [x] Refactor `src/services/db-local-service.ts` to use `LogService`.
- [x] Refactor `src/services/db-aws-service.ts` to use `LogService`.
- [x] Refactor `src/services/schedule-service.ts` to use `LogService` (if applicable).
- [ ] Verify functionality:
    - [ ] Start app and check standard logs.
    - [ ] Simulate an error with nested/circular data and verify log output is clean and limited.
