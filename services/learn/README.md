# Learn Service

gRPC service for feedback collection and experience learning.

## Endpoints

| Method             | Description                                          |
| ------------------ | ---------------------------------------------------- |
| `RecordFeedback`   | Records user feedback (thumbs up/down) for a message |
| `QueryFeedback`    | Queries stored feedback records with filters         |
| `GetExperience`    | Gets the current learned experience                  |
| `UpdateExperience` | Triggers the learning batch job                      |

## Configuration

Add to `config/config.json`:

```json
{
  "services": {
    "learn": {
      "port": 50060
    }
  }
}
```

## Usage

```bash
make rc-learn  # Start the learn service
```
