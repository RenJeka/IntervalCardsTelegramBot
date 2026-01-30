# detailed step-by-step TODO plan for ICTB-42

- [x] Modify `IDbService` interface
    - [x] Add `removeUserFavoriteCategory(userId: number, category: string): Promise<DbResponse>`
- [x] Update `DbAwsService`
    - [x] Implement `removeUserFavoriteCategory` using DynamoDB `DELETE` update expression.
- [x] Refactor `MessageService`
    - [x] Rename `addFavoriteCategoryHandler` to `toggleFavoriteCategoryHandler`.
    - [x] In `toggleFavoriteCategoryHandler`:
        - [x] Get current favorite categories for validation.
        - [x] Check if the clicked category is already in the list.
        - [x] If present: Call `removeUserFavoriteCategory`.
        - [x] If absent: Call `addUserFavoriteCategory`.
        - [x] Update the message with the new list of categories.
        - [x] Handle errors gracefully using `LogService`.
- [ ] Verify functionality
    - [ ] Add a category.
    - [ ] Remove the same category.
    - [ ] Verify persistence.