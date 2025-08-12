# Changelog

## 2025-08-12

- Removed basepath handling from PromptStorage constructor and methods
- PromptStorage now works directly with file names instead of basepath/filename
  combinations
- Simplified constructor to only require storage parameter
- Moved PromptStorage class from libstorage to libprompt package
- Added dependency on @copilot-ld/libstorage package
- Updated PromptStorage to use underscore property names for consistency with
  Prompt class
