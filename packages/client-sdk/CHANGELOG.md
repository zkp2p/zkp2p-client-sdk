# Changelog

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) and [Conventional Commits](https://www.conventionalcommits.org/).

## [1.0.0] - 2025-01-26

### 🎉 Major Release

This release brings feature parity with the React Native SDK and introduces powerful new features for web developers.

### Added

#### New Features
- **Unified Authentication API**: New `authenticateAndGenerateProof` method that combines metadata request and proof generation
- **React Hooks**: Complete set of hooks for React applications (`useZkp2pClient`, `useQuote`, `useSignalIntent`, etc.)
- **Enhanced Callbacks**: Granular progress tracking with `onProofGenerated`, `onProofError`, `onProgress`
- **Constants Module**: Comprehensive export of platforms, currencies, chain IDs, and metadata

#### Developer Experience
- Full TypeScript support with improved type exports
- React as optional peer dependency (works with any framework)
- Better error messages and validation
- Comprehensive documentation and examples

### Changed
- **Breaking**: Reorganized module exports for better tree-shaking
- Improved extension orchestrator with better state management
- Enhanced proof generation flow with progress callbacks

### Migration from 0.x
See README for detailed migration guide and new API usage examples.

## [0.4.2] - Previous
- Bug fixes and performance improvements

## [0.4.1] - Previous
- Minor updates

## [0.4.0] - Previous
- Extension integration improvements

## [0.1.0] - Initial Release
- Initial public release of `@zkp2p/client-sdk` with core actions, extension helper, and documentation.

