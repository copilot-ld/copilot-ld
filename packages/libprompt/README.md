# libprompt

Prompt template loading and rendering utilities using Mustache templating.

## Usage

```javascript
import { PromptLoader } from "@copilot-ld/libprompt";

const loader = new PromptLoader(promptDir);
const prompt = await loader.render("system", { name: "Agent" });
```

## API

| Export         | Description                          |
| -------------- | ------------------------------------ |
| `PromptLoader` | Load and render .prompt.md templates |
