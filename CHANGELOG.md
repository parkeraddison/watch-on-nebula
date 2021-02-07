# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]
### Added
- Start using a changelog
- Addition to Chrome store
- If the data from StandardTV isn't seen in a while, it'll be requested again

### Changed
- Handle breaking site change to Standard TV for parsing channel IDs
- Handle breaking site change to Standard TV for parsing channel names
- Use inline styling for nebula star svg rather than stylesheet (class names can conflict with youtube styles)
- Clicking "Watch on Nebula" only searches the video title, no longer the additional creator name (some searches didn't show up, e.g. "Real Engineering The Truth about Hydrogen" has zero results but "The Truth about Hydrogen" has one)

### Removed
- Unnecessary permissions request for youtube.com

## [0.0.1] - 2021-01-08
### Added
- Core functionality of extension
- Addition to Firefox addons
