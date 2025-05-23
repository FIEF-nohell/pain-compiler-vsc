import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	vscode.languages.onDidChangeDiagnostics((e) => {
		e.uris.forEach(uri => {
			const diagnostics = vscode.languages.getDiagnostics(uri);
			diagnostics.forEach(diag => {
				if (diag.severity === vscode.DiagnosticSeverity.Error) {
					sendErrorToAPI({
						message: diag.message,
						file: uri.fsPath,
						line: diag.range.start.line + 1,
						column: diag.range.start.character + 1,
						timestamp: new Date().toISOString()
					});
				}
			});
		});
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
		await fetch("https://deine-api.com/errors", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(error)
		});
	} catch (e) {
		console.error("Fehler beim Senden:", e);
	}
}
