# detailed step-by-step TODO plan for ICTB-42

- [ ] Modify `IDbService` interface
    - [ ] Add `removeUserFavoriteCategory(userId: number, category: string): Promise<DbResponse>`
- [ ] Update `DbAwsService`
    - [ ] Implement `removeUserFavoriteCategory` using DynamoDB `DELETE` update expression.
- [ ] Refactor `MessageService`
    - [ ] Rename `addFavoriteCategoryHandler` to `toggleFavoriteCategoryHandler`.
    - [ ] In `toggleFavoriteCategoryHandler`:
        - [ ] Get current favorite categories for validation.
        - [ ] Check if the clicked category is already in the list.
        - [ ] If present: Call `removeUserFavoriteCategory`.
        - [ ] If absent: Call `addUserFavoriteCategory`.
        - [ ] Update the message with the new list of categories.
        - [ ] Handle errors gracefully using `LogService`.
- [ ] Verify functionality
    - [ ] Add a category.
    - [ ] Remove the same category.
    - [ ] Verify persistence.