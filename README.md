
# 🛠 pain-compiler

VS Code Extension, die automatisch Compiler-Fehler erkennt und an eine API sendet – mit 5 Sekunden Bedenkzeit 😈

## 🔧 Setup

```bash
yarn
```

## 🚀 Entwicklung & Nutzung

### 1. Extension builden

```bash
yarn build
```

> Dadurch wird der Code mit `esbuild` nach `out/` gebaut
> und eine `.vsix`-Datei im Root-Ordner erstellt (z. B. `pain-compiler-0.0.1.vsix`).

---

### 🔄 Option A: Extension lokal debuggen (empfohlen für Entwicklung)

1. Öffne das Projekt in VS Code
2. Drücke `F5` → startet den **Extension Development Host**

---

### 📦 Option B: Extension als VSIX installieren

1. Öffne **VS Code**
2. Öffne die **Command Palette** (`Ctrl+Shift+P`)
3. Wähle **"Extensions: Install from VSIX..."**
4. Wähle die Datei `pain-compiler-x.x.x.vsix`
5. Die Extension erscheint dann in der Extensions-Leiste (Ctrl+Shift+X)

---

## 🧪 Fehler testen

Erzeuge absichtlich einen Compilerfehler (z. B. in `.ts`, `.js`, `.py`).
Die Extension erkennt diesen und sendet ihn **5 Sekunden später** an deine API –
**sofern du ihn nicht rechtzeitig behebst** 😈

