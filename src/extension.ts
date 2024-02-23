// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GitExtension } from './types/git';
import {
  ExecException,
  ExecFileException,
  exec,
  execFile
} from 'child_process';
import { Changes, countChanges, formatChanges } from './main';

const isWin = process.platform === 'win32';
const formatPath = (uri: string) => {
  if (!isWin) {
    return uri;
  }
  const fragments = uri.split('/');
  const startIndex = uri.startsWith('/') ? 1 : 0;
  const disk = fragments[startIndex].toUpperCase();
  return [disk, ...fragments.slice(startIndex + 1)].join('\\');
};

const diff_shortstat = (cwd: string) => {
  return new Promise<Changes | undefined>((resolve, reject) => {
    exec(
      'git diff --shortstat',
      { cwd },
      async (error: ExecException | null, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(countChanges(stdout));
        }
      }
    );
  });
};

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "diff-view" is now active!');

  const status = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  );

  const folders = vscode.workspace.workspaceFolders;
  if (!folders) {
    return;
  }
  const rootPath = folders[0].uri.path;
  const pattern = new vscode.RelativePattern(rootPath, '**/*');
  const watcher = vscode.workspace.createFileSystemWatcher(pattern);
  console.log('root path', rootPath);
  watcher.onDidChange(() => {
    updateStatusBar();
  });
  vscode.workspace.onDidChangeConfiguration(() => {
    updateStatusBar();
  });
  updateStatusBar();

  // Function to update the status bar with git diff output
  async function updateStatusBar() {
    try {
      const changes = await diff_shortstat(formatPath(rootPath));
      if (changes) {
        status.text = formatChanges(changes);
        status.tooltip = changes.stdout;
        status.show();
      } else {
        status.hide();
      }
    } catch (e) {
      console.error('cannot show stats', e);
      status.hide();
    }
  }

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    'diff-view.helloWorld',
    () => {
      updateStatusBar();
    }
  );

  context.subscriptions.push(disposable);

  // Update the status bar every 5 seconds (5000 milliseconds)
  // setInterval(updateStatusBar, 5000);
}

// This method is called when your extension is deactivated
export function deactivate() {}
