import * as vscode from 'vscode';

type ErrorKey = string;
const sentErrors = new Set<ErrorKey>();
const pendingErrors = new Map<ErrorKey, NodeJS.Timeout>();
const config = vscode.workspace.getConfiguration("painCompiler");
const madness = config.get<number>("madness") || 0;
const apiUrl = config.get<string>("apiEndpoint") || "http://127.0.0.1:8000/trigger";

export function activate(context: vscode.ExtensionContext) {
	console.log("Pain compiler activated");

	const scheduleErrorSend = async (uri: vscode.Uri, diag: vscode.Diagnostic) => {
		const errorKey: ErrorKey = `${uri.fsPath}:${diag.range.start.line}:${diag.range.start.character}:${diag.message}`;
		console.log("🔍 Fehler gefunden:");
		console.log(diag);
		if (sentErrors.has(errorKey) || pendingErrors.has(errorKey)) {
			return;
		}

		const doc = await vscode.workspace.openTextDocument(uri);
		const codeLine = doc.lineAt(diag.range.start.line).text.trim();

		pregenerateError({
			code: codeLine,
			message: diag.message
		});

		const timeout = setTimeout(() => {
			const currentDiagnostics = vscode.languages.getDiagnostics(uri);
			const stillExists = currentDiagnostics.some(d =>
				d.range.start.line === diag.range.start.line &&
				d.range.start.character === diag.range.start.character &&
				d.message === diag.message
			);

			if (stillExists) {

				console.log("📤 Fehler noch da, wird gesendet:", errorKey);
				sendErrorToAPI({
					code: codeLine,
					message: diag.message
				});
				sentErrors.add(errorKey);
			} else {
				console.log("✅ Fehler wurde rechtzeitig behoben:", errorKey);
			}

			pendingErrors.delete(errorKey);
		}, 5000);

		pendingErrors.set(errorKey, timeout);
	};

	vscode.languages.onDidChangeDiagnostics((e) => {
		e.uris.forEach(uri => {
			const diagnostics = vscode.languages.getDiagnostics(uri);
			diagnostics.forEach(diag => {
				switch (madness) {
					case 1:
						if (diag.severity === 0 || diag.severity === 1) {
							scheduleErrorSend(uri, diag);
						}
						break;
					case 2:
						if (diag.severity === 0 || diag.severity === 1 || diag.severity === 2) {
							scheduleErrorSend(uri, diag);
						}
						break;
					default:
						if (diag.severity === 0) {
							scheduleErrorSend(uri, diag);
						}
						break;
				}
			});
		});
	});
}

async function sendErrorToAPI(error: {
	code: string;
	message: string;
}) {
	try {
		console.log("📤 Senden:", error);
		await fetch(apiUrl + "/trigger", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(error)
		});
	} catch (e) {
		console.error("❌ Fehler beim Senden:", e);
	}
}

async function pregenerateError(error: {
	code: string;
	message: string;
}) {
	try {
		console.log("📤 Senden:", error);
		await fetch(apiUrl + "/pregenerate", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(error)
		});
	} catch (e) {
		console.error("❌ Fehler beim Senden:", e);
	}
}