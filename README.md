
# 🛠 pain-compiler

VS Code Extension, die automatisch Compiler-Fehler erkennt und an eine API sendet – mit 5 Sekunden Bedenkzeit 😈

## 🔧 Setup

```bash
yarn install
````

## 🚀 Entwicklung starten

### 1. Extension builden

```bash
yarn serve
```

> Dadurch wird der Code mit `esbuild` nach `out/` gebaut.

### 2. Extension ausführen

Drücke `F5` in VS Code → eine neue Instanz mit aktiver Extension startet.

## 🧪 Fehler testen

Erzeuge absichtlich einen Compilerfehler (z. B. in `.ts` oder `.py`).
Die Extension sendet den Fehler 5 Sekunden später an deine API – **wenn du ihn nicht vorher behebst.**
