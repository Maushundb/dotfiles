# Hybrid Next

[![Version][version-image]][marketplace-url]
[![Installs][installs-image]][marketplace-url]
[![Rating][rating-image]][marketplace-url]

> A port of the [Hybrid Next](https://github.com/kaicataldo/hybrid-next-syntax) theme to VS Code.

## Installation

### Extension Marketplace

Launch VS Code Quick Open (⌘+P), paste the following command, and press <kbd>enter</kbd>.

`ext install theme-hybrid-next`

### Download `.vsix` From Releases

Go to the [latest release](https://github.com/wyze/vscode-hybrid-next/releases/latest) and download the `.vsix` file.

Use the VS Code Command Palette (⇧⌘P) and run `Extensions: Install from VSIX...`.

### Clone Repository

Change to your VS Code extensions directory:

```sh
# Windows
$ cd %USERPROFILE%\.vscode\extensions

# Linux & macOS
$ cd ~/.vscode/extensions/
```

Clone this repository as `wyze.theme-hybrid-next`:

```sh
$ git clone https://github.com/wyze/vscode-hybrid-next.git wyze.theme-hybrid-next
```

## Screenshots

> Screenshots are using [Fira Code](https://github.com/tonsky/FiraCode) font.

### Base

![JS](https://github.com/wyze/vscode-hybrid-next/raw/master/.github/media/js.png)
![HTML](https://github.com/wyze/vscode-hybrid-next/raw/master/.github/media/html.png)

### Gray Background

![Gray Background JS](https://github.com/wyze/vscode-hybrid-next/raw/master/.github/media/graybg-js.png)
![Gray Background HTML](https://github.com/wyze/vscode-hybrid-next/raw/master/.github/media/graybg-html.png)

## Build

This will generate the themes to the `themes/` folder.

```sh
$ git clone https://github.com/wyze/vscode-hybrid-next.git
$ cd vscode-hybrid-next
$ npm install
$ npm run build
```

## Credits

Thank you to [Kai Cataldo](https://github.com/wyze/vscode-hybrid-next/blob/master/github.com/kaicataldo) for making the Hybrid Next theme for Atom.

## Change Log

> [Full Change Log](https://github.com/wyze/vscode-hybrid-next/blob/master/changelog.md)

### [v2.3.1](https://github.com/wyze/vscode-hybrid-next/releases/tag/v2.3.1) (2018-10-24)

* [[`446643a981`](https://github.com/wyze/vscode-hybrid-next/commit/446643a981)] - Improve readability of ansiBrightBlack terminal color (#5) (Chris Lewis)

## License

MIT © [Neil Kistner](https://neilkistner.com)

[version-image]: https://vsmarketplacebadge.apphb.com/version/wyze.theme-hybrid-next.svg
[installs-image]: https://vsmarketplacebadge.apphb.com/installs/wyze.theme-hybrid-next.svg
[rating-image]: https://vsmarketplacebadge.apphb.com/rating-short/wyze.theme-hybrid-next.svg

[marketplace-url]: https://vsm.li/wyze.theme-hybrid-next