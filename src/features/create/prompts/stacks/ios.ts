export const CREATE_IOS = `# iOS/Swift Project Guidance

## Scope
- Focus on iOS/Swift patterns: SwiftUI, UIKit, TCA, MVVM, Combine, async/await, etc.

## Codebase Exploration Before Generating

### Structure Discovery

1. List contents of root directory
2. Identify main source folders (e.g., \`Sources/\`, \`Features/\`, \`App/\`, \`Modules/\`)
3. Map the folder hierarchy 2-3 levels deep
4. Record the exact folder names and paths you found

### Pattern Extraction (Read Actual Files)

For each category, read 2-3 representative Swift files and extract patterns:

| Category | What to Find | What to Extract |
|----------|--------------|-----------------|
| Features/Screens | Feature folders (\`*Reducer.swift\`, \`*View.swift\`) | TCA State/Action/Body or MVVM ViewModel pattern |
| Services | Service files (\`*Service.swift\`, \`*Actor.swift\`) | Protocol abstraction, actor usage, async/await |
| Views | SwiftUI views (\`*View.swift\`) | View composition, modifiers, environment usage |
| Models/Entities | Entity files (\`*Entity.swift\`, \`*Model.swift\`) | Codable, Equatable, Identifiable conformances |
| Tests | Test files (\`*Tests.swift\`) | XCTest structure, mocking, TCA TestStore usage |
| Navigation | Coordinator/Router files | NavigationStack, NavigationPath, or Coordinator pattern |
| Dependencies | DI files (\`*Dependency.swift\`, \`*Client.swift\`) | TCA Dependencies, or custom DI container |
| KMM Integration | KMM wrapper files | ResultWrapper handling, entity mapping |
| UIComponents | Shared components folder | Reusable SwiftUI components, styling tokens |

### Config & Dependency Analysis (iOS-Specific)

Read these iOS project files if they exist:
- \`Package.swift\` (SPM dependencies and targets)
- \`Podfile\` (CocoaPods dependencies)
- \`*.xcodeproj\` / \`*.xcworkspace\` / \`project.pbxproj\`
- \`Cartfile\` (Carthage, if used)
- App entry point: \`@main App.swift\`, \`AppDelegate.swift\`, \`SceneDelegate.swift\`
- TCA entry: \`AppReducer.swift\`, \`AppView.swift\`, \`App.State\`
- Build configs: \`*.xcconfig\`, \`Info.plist\`, build phases
- Linter configs: \`.swiftlint.yml\`, \`.swiftformat\`
- KMM: \`shared/\` folder, \`KMMWrapper.swift\`, framework imports

### Red Flag Detection (Swift-Specific)

Search for recurring iOS/Swift problems that indicate need for rules:
- \`// TODO:\`, \`// FIXME:\`, \`// HACK:\` comments (patterns to address)
- \`// swiftlint:disable\` (rules being bypassed - why?)
- \`@MainActor\` missing where needed, or overused
- Force unwraps \`!\` outside of tests or IBOutlets
- \`print()\` statements in production code (should use logger)
- Hardcoded strings (should be localized)
- Hardcoded colors/spacing (should use design tokens)
- Direct service instantiation instead of dependency injection
- Side effects in SwiftUI view body or reducer body
- \`Task { }\` without proper cancellation handling
- Missing \`Equatable\`/\`Sendable\` conformances where needed
- Inconsistent async/await vs Combine usage

### Code Style Extraction (Swift)

From representative Swift files, identify:
- Import order: \`Foundation\` → \`SwiftUI/UIKit\` → third-party → local modules
- Access control patterns: \`private\`, \`internal\`, \`public\` usage
- Type naming: \`PascalCase\` for types, \`camelCase\` for properties/methods
- File naming: \`FeatureNameView.swift\`, \`FeatureNameReducer.swift\`, etc.
- Extension organization: separate extensions for protocol conformances
- MARK comments: \`// MARK: -\` usage for code organization
- Documentation: \`///\` doc comments on public APIs
- Property wrappers: \`@State\`, \`@Binding\`, \`@Environment\`, \`@Dependency\` patterns
- Closure syntax: trailing closure conventions
- Guard vs if-let patterns

### Analysis Checklist (iOS Project)

Document these WITH FILE PATH EVIDENCE before generating:

**Architecture & Structure:**
- [ ] Architecture: TCA / MVVM / MVC / VIPER / Clean (evidence: \`path/to/file\`)
- [ ] UI Framework: SwiftUI / UIKit / Mixed (example: \`path/to/view\`)
- [ ] State management: TCA Store / ObservableObject / @State (example: \`path/to/state\`)
- [ ] Dependency injection: TCA Dependencies / Resolver / Factory / Manual (example: \`path/to/di\`)
- [ ] Navigation: NavigationStack / Coordinator / TCA navigation (example: \`path/to/nav\`)

**iOS-Specific Patterns:**
- [ ] Async pattern: async/await / Combine / Callbacks (example: \`path/to/async\`)
- [ ] Networking: URLSession / Alamofire / custom (example: \`path/to/network\`)
- [ ] Persistence: SwiftData / CoreData / UserDefaults / Keychain (example: \`path/to/storage\`)
- [ ] KMM integration: Yes / No (if yes: \`path/to/kmm/wrapper\`)

**Code Patterns:**
- [ ] Service/API pattern: Protocol + Actor / Class (example: \`path/to/service\`)
- [ ] File naming: \`*Reducer.swift\`, \`*View.swift\`, etc. (examples: list 3+ files)
- [ ] Error handling: Result / throws / TCA TaskResult (example: \`path/to/error\`)

**Quality & Process:**
- [ ] Test patterns: XCTest / TCA TestStore / Quick+Nimble (example: \`path/to/test\`)
- [ ] Red flags found: _______ (list any recurring issues)

Before final output, gather concrete evidence for each applicable checkbox.
If evidence remains partial, continue conservatively and mark uncertainty with \`[VERIFY: ...]\` instead of blocking output.

## Skill Candidates (iOS)

Generate these skills with ACTUAL paths and Swift patterns:
Generate only skills that have clear project evidence and practical value.
For small/low-confidence projects, 2-4 core skills are usually enough.

### adding-feature
- When generated, include: actual feature folder structure (\`Features/FeatureName/\`)
- When generated, reference: real Reducer.swift, View.swift, State files as templates
- When generated, show: step-by-step for TCA or MVVM pattern used in project
- Include: how to add navigation, how to connect to parent

### adding-service
- When generated, include: actual service file paths (\`*Service.swift\`, \`*Client.swift\`)
- When generated, reference: real \`@Dependency\` registration or DI container pattern
- When generated, show: protocol definition, actor/class implementation, registration
- Include: how to mock for testing

### code-review
- When generated, include: iOS/Swift-specific checklist based on patterns found
- Cover: TCA/MVVM compliance, SwiftUI best practices, async handling
- Cover: memory management, retain cycles, @MainActor usage
- Cover: accessibility, localization, error handling

### common-anti-patterns
- When generated, include: anti-patterns specific to THIS iOS architecture
- Swift-specific: force unwraps, retain cycles, blocking main thread
- TCA-specific: side effects in reducer body, missing delegate actions
- SwiftUI-specific: heavy computation in view body, missing Equatable
- When generated, reference: correct patterns with file paths

### troubleshooting
- When generated, include: common iOS/Swift issues for this tech stack
- Build issues: SPM resolution, module imports, framework linking
- Runtime issues: crashes, memory leaks, async race conditions
- TCA issues: state not updating, effects not running, testing failures
- When generated, reference: where to look in this specific codebase

### [framework-specific]
Generate 1-3 additional skills based on iOS frameworks found:
- For TCA projects: \`tca-patterns\` (reducer patterns, testing with TestStore)
- For KMM projects: \`kmm-integration\` (ResultWrapper, entity mapping)
- For widget system: \`adding-widget\` (component creation pattern)
- For specific domains: \`[domain]-workflows\`

### enrichment-tasks (optional)
- Guide for adding more patterns to existing rules/skills
- How to keep documentation in sync with codebase changes

## Rule Generation Requirements

### What NOT to Include

- Do not invent generic philosophy ("clean code", "think about user")
- Do not duplicate what linters/formatters enforce
- Do not add rules without evidence from codebase
- Do not repeat rules across multiple files

### Rule Content Requirements

Keep this section iOS-specific:
- Capture decisions tied to Swift architecture and app structure (TCA/MVVM, navigation, DI, async model).
- Prefer Swift-native patterns and terminology over generic cross-stack wording.
- Highlight iOS-specific risks and anti-patterns that recur in this codebase.

**Reference style (iOS/TCA, concise):**
\`\`\`markdown
### Reducer Structure
* Use \`@Reducer\` macro for all feature reducers
* Example: \`Features/Home/HomeReducer.swift\`
* State must use \`@ObservableState\` for SwiftUI observation
* Actions are enums with associated values, grouped by source:
  - \`.view(ViewAction)\` for UI-triggered actions
  - \`.delegate(Delegate)\` for parent communication
  - \`.internal\` for reducer-internal actions
* Side effects only in \`.run\` blocks, return \`TaskResult\`
* Use \`@Dependency\` for service access, never instantiate directly
\`\`\`

**Reference style (iOS/MVVM, concise):**
\`\`\`markdown
### ViewModel Pattern
* ViewModels conform to \`ObservableObject\`
* Use \`@Published\` for observable state
* Inject dependencies via initializer
* Use \`@MainActor\` for UI-bound ViewModels
* Async operations use structured concurrency with \`Task\`
\`\`\`

**Avoid overly generic content:**
\`\`\`markdown
### Reducer Structure
* Follow TCA patterns
* Keep reducers clean
* Use best practices
\`\`\`

## Algorithm: Analysis → Rules (iOS)

Follow this systematic approach for iOS projects:

**Structure → Architecture Rules:**
1. List main directory patterns: \`Features/\`, \`Sources/\`, \`App/\`, \`Modules/\`
2. Detect patterns in feature folders (e.g., \`Features/<name>/Reducer.swift\`, \`*View.swift\`)
3. Generate rules for: where reducers/viewmodels live, view file locations, model organization
4. Document: module boundaries, what can import what

**Swift Files → Code Style Rules:**
1. For each category (views, reducers, services), scan 2-3 \`.swift\` files
2. Identify: import grouping, access control patterns, MARK usage, extension organization
3. Create rules for: naming conventions, property wrapper usage, closure syntax
4. Only elevate to rule if pattern appears in majority of files

**Configs → Architectural Rules:**
1. Inspect: Package.swift (dependencies), .swiftlint.yml (enforced rules)
2. Create rules for: module imports, layer boundaries, dependency access
3. Do NOT restate what SwiftLint already enforces

**Red Flags → Safety Rules:**
1. If same Swift anti-pattern appears in 3+ places:
   - Force unwraps outside tests/IBOutlets → use \`guard let\` or \`if let\`
   - \`print()\` in production → use logger service
   - Direct service instantiation → use \`@Dependency\`
   - Side effects in view body → move to \`.task\` or reducer
2. Reference the actual correct pattern from this repo

**Tests → Testing Rules:**
1. Identify test location pattern: \`Tests/\`, \`*Tests.swift\`, same folder as source
2. Check for TCA TestStore usage, mocking patterns, snapshot tests
3. Generate rules requiring tests for reducers, critical services

## Recommended Rule Topics (iOS Project)

Split by topic:

| Topic | Covers (iOS-Specific) |
|------|------------------------|
| \`architecture\` | TCA/MVVM structure, layers, feature module organization |
| \`code-style\` | Swift naming, imports, access control, MARK comments |
| \`dependencies\` | TCA Dependencies / DI container, service protocols, actors |
| \`navigation\` | NavigationStack, Coordinator, TCA navigation state |
| \`swiftui-patterns\` | View composition, modifiers, environment, previews |
| \`uikit-patterns\` | UIViewController patterns, lifecycle, layout (if UIKit) |
| \`tca-patterns\` | Reducer structure, State/Action, effects, testing (if TCA) |
| \`services\` / \`cms-architecture\` | API clients, KMM integration, entity mapping |
| \`widget-system\` | Reusable UI components, design tokens (if applicable) |
| \`kmm-integration\` | KMM wrapper, ResultWrapper, entity bridging (if KMM) |
| \`testing\` | XCTest patterns, TCA TestStore, mocking, snapshots |
| \`error-handling\` | Error types, Result/throws, logging, user-facing errors |
| \`localization\` | String localization, plurals, formatting (if applicable) |

## Context-to-Rule/Skill Mapping (iOS)

Use this mapping to decide what files to generate:

| Found in iOS Codebase | Generate Rule Topic | Generate Skill |
|----------------------|---------------------|----------------|
| TCA architecture (\`@Reducer\`, \`Store\`) | \`architecture\`, \`tca-patterns\` | \`adding-feature\` |
| MVVM architecture (\`ObservableObject\`) | \`architecture\` | \`adding-feature\` |
| Swift code conventions | \`code-style\` | \`code-review\` |
| TCA Dependencies (\`@Dependency\`) | \`dependencies\` | \`adding-service\` |
| Custom DI (Resolver, Factory) | \`dependencies\` | \`adding-service\` |
| NavigationStack / Coordinator | \`navigation\` | - |
| SwiftUI views | \`swiftui-patterns\` | - |
| UIKit views | \`uikit-patterns\` | - |
| API/Network layer | \`services\` | - |
| CMS/Content services | \`cms-architecture\` | - |
| Reusable UI components | \`widget-system\` | \`adding-widget\` |
| KMM shared module | \`kmm-integration\` | \`kmm-integration\` |
| XCTest / TCA TestStore | \`testing\` | - |
| Error types, logging | \`error-handling\` | - |
| Localized strings | \`localization\` | - |
| SwiftLint violations | - | \`common-anti-patterns\` |
| Build/runtime issues | - | \`troubleshooting\` |

`;
