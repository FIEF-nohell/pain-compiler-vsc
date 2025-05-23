import * as vscode from 'vscode';

type ErrorKey = string;
const sentErrors = new Set<ErrorKey>();

let debounceTimer: NodeJS.Timeout | null = null;

export function activate(context: vscode.ExtensionContext) {
	console.log("Pain compiler activated");

	const sendDiagnosticErrors = (uris: vscode.Uri[]) => {
		uris.forEach(uri => {
			const diagnostics = vscode.languages.getDiagnostics(uri);
			console.log("🛠️ Diagnose:", uri.fsPath, diagnostics);
			diagnostics.forEach(diag => {
				const errorKey = `${uri.fsPath}:${diag.range.start.line}:${diag.range.start.character}:${diag.message}`;
				if (!sentErrors.has(errorKey)) {
					sendErrorToAPI({
						message: diag.message,
						file: uri.fsPath,
						line: diag.range.start.line + 1,
						column: diag.range.start.character + 1,
						timestamp: new Date().toISOString()
					});
					sentErrors.add(errorKey);
				}
			});
		});
	};

	vscode.languages.onDidChangeDiagnostics((e) => {
		console.log("🛠️ Änderung erkannt:", e.uris.map(uri => uri.fsPath));
		sendDiagnosticErrors([...e.uris]);
	});
}

async function sendErrorToAPI(error: {
	message: string;
	file: string;
	line: number;
	column: number;
	timestamp: string;
}) {
	try {
		console.log("📤 Senden:", error);
		await fetch("http://127.0.0.1:5000/errors", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(error)
		});
	} catch (e) {
		console.error("❌ Fehler beim Senden:", e);
	}
}
