# Subscription localizations

This folder is used by the `fastlane ios subscription_localizations` lane to sync App Store Connect subscription localizations (display name + description) via the App Store Connect API.

## Layout

Create one directory per subscription `product_id` (App Store Connect product ID), and one JSON file per locale:

- `fastlane/subscriptions/<product_id>/en-US.json`
- `fastlane/subscriptions/<product_id>/fi.json`

Each file must contain:

```json
{
  "name": "Weekly Pro",
  "description": "Unlimited access to all games and settings."
}
```

## Run

Dry-run (default):

`fastlane ios subscription_localizations`

Apply changes:

`DRY_RUN=0 fastlane ios subscription_localizations`

If this folder has no subscription JSON files, the lane exits without changes.
