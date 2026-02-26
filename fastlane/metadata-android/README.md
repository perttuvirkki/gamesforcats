# Google Play listing metadata (Fastlane supply)

This folder contains per-locale Google Play **store listing** metadata in the format expected by `fastlane supply` / `upload_to_play_store`.

Files per locale:
- `title.txt`
- `short_description.txt`
- `full_description.txt`

Optional:
- `changelogs/default.txt` or `changelogs/<versionCode>.txt` for "What's new"
- `images/` for feature graphics, screenshots, etc. (see `fastlane action supply`)

## Sync from App Store metadata

This repo keeps App Store Connect listing text in `fastlane/metadata/<locale>/*.txt`.
To bootstrap Google Play text from those files, run the sync in dry-run mode first:

```sh
DRY_RUN=1 fastlane android metadata
```

Then run it for real (requires Play service account JSON key):

```sh
export SUPPLY_JSON_KEY=/absolute/path/to/google-play-service-account.json
DRY_RUN=0 UPLOAD_IMAGES=0 UPLOAD_SCREENSHOTS=0 UPLOAD_CHANGELOGS=0 fastlane android metadata
```

By default, the sync strips the Privacy Policy + Terms URLs from `full_description.txt` (since Google Play has a dedicated privacy policy field). Disable with `STRIP_LEGAL_LINKS=0`.

## Screenshots from `assets/android`

If you keep Play screenshots under `assets/android/<Language (xx-YY)>/<Device Folder>/*.png`,
the `fastlane android metadata` lane will copy them into `fastlane/metadata-android/<xx-YY>/images/...`
in the format expected by `supply`.

Folders are mapped by name:
- `*Phone*` -> `images/phoneScreenshots/`
- `*7*` -> `images/sevenInchScreenshots/`
- `*10*` or `*Tablet*` -> `images/tenInchScreenshots/`

To upload them, run:

```sh
export SUPPLY_JSON_KEY=/absolute/path/to/google-play-service-account.json
DRY_RUN=0 UPLOAD_SCREENSHOTS=1 fastlane android metadata
```

If you only have `en-US` screenshots, the lane will also duplicate them to `en-GB` by default. Disable with `DUPLICATE_UK_FROM_US=0`.
If you don't have dedicated 7-inch tablet screenshots, the lane will duplicate `tenInchScreenshots` to `sevenInchScreenshots` by default. Disable with `DUPLICATE_SEVEN_FROM_TEN=0`.

## If `supply` crashes on an empty track

Some `fastlane` versions can crash when the selected track has no releases. If you see errors like `undefined method 'size' for nil`, set a track that has a release (usually `internal`) and optionally a version code:

```sh
SUPPLY_TRACK=internal SUPPLY_VERSION_CODE=123 DRY_RUN=0 UPLOAD_SCREENSHOTS=1 fastlane android metadata
```

If your app is still in **Draft** in Play Console, you may also need:

```sh
SUPPLY_RELEASE_STATUS=draft
```

By default this lane sets `changes_not_sent_for_review=true` so listing changes are saved but not automatically sent for review/publishing. Override with:

```sh
SUPPLY_CHANGES_NOT_SENT_FOR_REVIEW=0
```

On draft apps, Google can also require the targeted `versionCode` to be attached to a **draft** release on the track. If you set both `SUPPLY_RELEASE_STATUS=draft` and `SUPPLY_VERSION_CODE`, this lane will automatically attach that version code to the track release.
