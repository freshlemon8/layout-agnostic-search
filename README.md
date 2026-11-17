# Layout-Agnostic Search

GNOME Shell extension that allows finding applications by entering queries in a mismatched keyboard layout. Translates Cyrillic input (ЙЦУКЕН-RU, ЙЦУКЕН-UA) to QWERTY so that applications with Latin names are found.

Example: the query `ашкуащч` in Russian layout finds Firefox, and `диски` matches Files.

## Supported GNOME Shell versions

- GNOME 50 (verified on 50.5)
- GNOME 51 (verified on Fedora 45)

Other versions were not checked.

## Installation

### From archive

1. Download `layout-agnostic-search@freshlemon8.github.io.zip` from the release page.
2. Run:
   ```bash
   gnome-extensions install --force layout-agnostic-search@freshlemon8.github.io.zip
   gnome-extensions enable layout-agnostic-search@freshlemon8.github.io
   ```
3. Restart the session (Alt+F2, `r` on Xorg, or log out and back in on Wayland).

### From source

```bash
git clone https://github.com/freshlemon8/layout-agnostic-search
cd layout-agnostic-search
gnome-extensions pack --force --out-dir=dist src
gnome-extensions install --force dist/layout-agnostic-search@freshlemon8.github.io.zip
```

## How it works

When the user types a query in Cyrillic, the extension translates each word to QWERTY using both ЙЦУКЕН-RU and ЙЦУКЕН-UA keyboard maps. The original query is always kept, so applications with Cyrillic names are also found. All results are merged and deduplicated, with the original query results appearing first.

Latin input is not translated -- it is searched as-is.

## Tests

```bash
gjs -m tests/translator.test.js
```

## Limitations

- The extension modifies the behavior of GNOME Shell's internal app search provider. After an upstream GNOME update, the extension may need to be revised.
- Variants are not generated for queries containing digits or strings longer than 128 characters.

## License

GPL-3.0-or-later. See the `LICENSE` file.
