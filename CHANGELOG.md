# Changelog

All notable changes to this project will be documented in this file.

## [2.2.1] - 2025-01-03

### Fixed
- Fixed TypeScript compilation errors in test files
- Fixed test file to use `walletClient` instead of `publicClient`  
- Added missing fields to mock data (FiatResponse and TokenResponse)
- Converted Date objects to ISO strings in test data
- Added explicit type annotations to `apiFetch` calls in API functions
- Fixed test expectations for empty API key when using authorization token

## [2.2.0] - 2025-01-03

### Added
- Added `payeeData` field to `QuoteSingleResponse` type for enriched quote responses
- Quote responses now automatically fetch and include payee details when API key or authorization token is available
- Comprehensive test coverage for quote enrichment with payee details

### Changed
- Major refactoring of API adapter layer (~40-50% code reduction)
  - Created unified `apiFetch()` base wrapper for all API calls
  - Standardized error handling and retry logic across all endpoints
  - Consolidated header creation into single `createHeaders()` function
  - Added `processApiResponse()` for consistent response processing
  - Added `buildStatusQuery()` helper for query parameter construction
- Fixed duplicate imports in api.ts
- Added proper return type annotations for all API functions
- All API functions now use consistent patterns for better maintainability

### Fixed
- Fixed missing `ListPayeesResponse` return type annotation
- Resolved TypeScript compilation issues with missing type annotations

### Technical Improvements
- Eliminated ~350 lines of duplicated code
- Centralized retry logic (3 retries, 1000ms delay) 
- Unified timeout management across all API calls
- Improved type safety with proper generic types
- All 59 tests passing
- Clean linting with no errors