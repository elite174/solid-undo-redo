# 1.4.0

## New features

- `toArray()` - returns a history array
- `arraySignal` - reactive `Accessor` of the history array

## Changes

- `createUndoRedoSignal` => `createSignalWithHistory`
- `clearHistory` => `clear`
- `UndoRedoSignalOptions<T>` => `SignalWithHistoryOptions<T>`
- `UndoRedoSignal<T>` => `SignalWithHistory<T>`
- `UndoRedoAPI<T>` => `History<T>`

## Others

- Fixed some bugs

# 1.3.3
- Fixed bug with isUndoPossible after clearing history with flag = true

# 1.3.1
- Added support for `clearCurrentValue` flag to clearHistory method

# 1.3.0
- Removed `onUndo`/`onRedo` options for signal
- Added ability to register multiple undo/redo callbacks with `registerCallback`
- Added ability to remove these callbacks with `removeCallback`
- Added `dispose` function which clears callbacks and history
- Improved docs

# 1.2.0

- Now you don't need to always pass an initial value to the signal
- `reactiveHistoryGenerator` => `createHistoryIterator`
- `Setter` type is not exported anymore. It's the same as in solid-js

# 1.1.0

- Added support for onUndo and onRedo callbacks
