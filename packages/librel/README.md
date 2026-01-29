# librel

Release management tools for version bumping, change detection between git
commits, and CloudFormation stack parameter retrieval.

## Usage

```javascript
import { VersionBumper, ChangeDetector, StackQuery } from "@copilot-ld/librel";

const bumper = new VersionBumper(packagePath);
await bumper.bump("minor");

const detector = new ChangeDetector(repoPath);
const changed = await detector.getChangedPackages(fromRef, toRef);
```

## API

| Export           | Description                             |
| ---------------- | --------------------------------------- |
| `VersionBumper`  | Version bumping (major/minor/patch)     |
| `ChangeDetector` | Detect changed packages between commits |
| `StackQuery`     | Retrieve CloudFormation outputs         |
