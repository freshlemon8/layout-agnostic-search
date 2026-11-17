# Layout-Agnostic Search

GNOME Shell extension that allows finding applications by entering queries in a mismatched keyboard layout: QWERTY, ЙЦУКЕН-UA, or ЙЦУКЕН-RU.

Example: the query `ашкуащч` finds Firefox, and `ыеуфь` matches Steam.

## Supported GNOME Shell versions

- GNOME 50 (verified on 50.5)
- GNOME 51 (verified on Fedora 45)

Other versions were not checked.

## Installation

### From archive

1. Download `layout-agnostic-search@freshlemon8.github.io.shell-extension.zip` from the release page.
2. Run:
   ```bash
   gnome-extensions install --force layout-agnostic-search@freshlemon8.github.io.shell-extension.zip
   gnome-extensions enable layout-agnostic-search@freshlemon8.github.io
   ```
3. Restart the session (Alt+F2, `r` on Xorg, or log out and back in on Wayland).

### From source

```bash
git clone https://github.com/freshlemon8/layout-agnostic-search
cd layout-agnostic-search
mkdir -p dist
gnome-extensions pack --force --extra-source=translator.js --out-dir=dist src
gnome-extensions install --force dist/layout-agnostic-search@freshlemon8.github.io.shell-extension.zip
gnome-extensions enable layout-agnostic-search@freshlemon8.github.io
```

Restart the session (Alt+F2, `r` on Xorg, or log out and back in on Wayland).

## How it works

The extension performs additional search variants for the original query, the same text translated to ЙЦУКЕН-RU, and the same text translated to ЙЦУКЕН-UA. Results are merged with the original results first.

## Tests

```bash
gjs -m tests/translator.test.js
```

## Limitations

- The extension modifies the behavior of GNOME Shell's internal app search provider. After an upstream GNOME update, the extension may need to be revised.
- Variants are not generated for queries containing digits or strings longer than 128 characters.

## License

GPL-3.0-or-later. See the `LICENSE` file.
