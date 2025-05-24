import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
// @ts-ignore
import * as tmp from 'tmp';

type ErrorKey = string;
const sentErrors = new Set<ErrorKey>();
const pendingErrors = new Map<ErrorKey, NodeJS.Timeout>();
const config = vscode.workspace.getConfiguration("painCompiler");
const madness = config.get<number>("madness") || 0;
const apiUrl = config.get<string>("apiEndpoint") || "http://127.0.0.1:8000/trigger";

// 🧠 Coding Challenges
interface Challenge {
	description: string;
	expectedOutput: string;
}

const challenges: Challenge[] = [
	{
		description: [
			'# Aufgabe: Gib exakt folgenden Output aus:',
			'#',
			'#      1',
			'#     2 2',
			'#    3   3',
			'#   4     4',
			'#  5       5',
			'#',
			'# Regeln:',
			'# - Keine Tabs, nur Leerzeichen.',
			'# - Kein print-Missbrauch.',
			'# - Genau diese Formatierung. Kein \\n extra.'
		].join('\n'),
		expectedOutput: [
			'    1',
			'   2 2',
			'  3   3',
			' 4     4',
			'5       5'
		].join('\n')
	},
	{
		description: [
			'# Aufgabe: Gib exakt folgenden Output aus:',
			'#',
			'# 0',
			'# 1 2',
			'# 3 4 5',
			'# 6 7 8 9',
			'#',
			'# Hinweis: Fortlaufende Zahlen, eine Zeile mehr pro Level.'
		].join('\n'),
		expectedOutput: [
			'0',
			'1 2',
			'3 4 5',
			'6 7 8 9'
		].join('\n')
	},
	{
		description: [
			'# Aufgabe: Gib exakt folgenden Output aus:',
			'#',
			'# A',
			'# B B',
			'# C   C',
			'# D     D',
			'#',
			'# Hinweis: Nur Buchstaben, auf Abstand achten.'
		].join('\n'),
		expectedOutput: [
			'A',
			'B B',
			'C   C',
			'D     D'
		].join('\n')
	}
];

export function activate(context: vscode.ExtensionContext) {
	console.log("Pain compiler activated");

	// 🩸 Pain Compiler Fehlerüberwachung
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

	// ✅ Challenge Befehl registrieren
	const challengeCommand = vscode.commands.registerCommand('painCompiler.runChallenge', async () => {
		console.log('⚡ Challenge gestartet');

		const challenge = challenges[Math.floor(Math.random() * challenges.length)];
		const expectedOutput = challenge.expectedOutput;

		let workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			const pickedFolder = await vscode.window.showOpenDialog({
				canSelectFolders: true,
				openLabel: 'Challenge-Ordner auswählen',
				canSelectFiles: false,
				canSelectMany: false,
			});

			if (!pickedFolder || pickedFolder.length === 0) {
				vscode.window.showWarningMessage('⚠️ Kein Ordner ausgewählt. Challenge wird nicht erstellt.');
				return;
			}

			await vscode.commands.executeCommand('vscode.openFolder', pickedFolder[0], false);
			return;
		}

		const folderPath = workspaceFolders[0].uri.fsPath;
		const now = new Date();
		const day = now.getDate().toString().padStart(2, '0');
		const month = (now.getMonth() + 1).toString().padStart(2, '0');
		const year = now.getFullYear().toString().slice(-2);
		const hour = now.getHours().toString().padStart(2, '0');
		const minute = now.getMinutes().toString().padStart(2, '0');
		const filename = `challenge_${day}_${month}_${year}_${hour}_${minute}.py`;
		const filePath = path.join(folderPath, filename);

		if (!fs.existsSync(filePath)) {
			fs.writeFileSync(filePath, `${challenge.description}\n\n`, 'utf8');
			const doc = await vscode.workspace.openTextDocument(filePath);
			await vscode.window.showTextDocument(doc);
		}

		function runPythonCode(code: string, callback: (result: string) => void) {
			const tempFile = tmp.fileSync({ postfix: '.py' });
			fs.writeFileSync(tempFile.name, code.trim());

			exec(`python3 "${tempFile.name}"`, (error, stdout, stderr) => {
				if (error) {
					console.error('❌ Python Fehler:', stderr);
					callback('error');
				} else {
					callback(stdout);
				}
				tempFile.removeCallback();
			});
		}

		function visualize(line: string): string {
			return line.replace(/ /g, '␣').replace(/\n/g, '\\n');
		}

		vscode.workspace.onDidSaveTextDocument((document) => {
			if (document.fileName.endsWith('.py')) {
				const editor = vscode.window.activeTextEditor;
				if (!editor) { return; };

				const code = editor.document.getText();

				runPythonCode(code, async (rawOutput) => {
					if (rawOutput === 'error') {
						vscode.window.showErrorMessage('⚠️ Fehler beim Ausführen des Codes. Denk an Einrückung und Format.');
						await fetch(apiUrl + "/wrong-solution", { method: 'POST' });
						return;
					}

					const actualLines = rawOutput.replace(/\r\n/g, '\n').trimEnd().split('\n');
					const expectedLines = expectedOutput.split('\n');

					const allMatch = actualLines.length === expectedLines.length &&
						actualLines.every((line, i) => line === expectedLines[i]);

					if (allMatch) {
						vscode.window.showInformationMessage('✅ Challenge bestanden! Alles perfekt.');
					} else {
						await fetch(apiUrl + "/wrong-solution", { method: 'POST' });
						vscode.window.showErrorMessage('❌ Deine Ausgabe stimmt nicht exakt. Details im Output-Panel.');

						const output = vscode.window.createOutputChannel('Challenge Checker');
						output.clear();
						output.appendLine('❌ Die Ausgabe stimmt nicht exakt.\n');
						output.appendLine('🔎 Erwartet (␣ = Leerzeichen):\n');
						expectedLines.forEach(l => output.appendLine(visualize(l)));
						output.appendLine('\n📤 Dein Output (␣ = Leerzeichen):\n');
						actualLines.forEach(l => output.appendLine(visualize(l)));
						output.appendLine('\n💡 Tipp: Achte auf exakte Anzahl von Leerzeichen und Zeilenumbrüchen.');
						output.show(true);
					}
				});
			}
		});
	});

	context.subscriptions.push(challengeCommand);
}

// Helper für API-Senden
async function sendErrorToAPI(error: { code: string; message: string }) {
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

async function pregenerateError(error: { code: string; message: string }) {
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
