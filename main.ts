import { link } from "fs";
import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

// Remember to rename these classes and interfaces!
// 置換先のフィールド名，フロントマターをコピーするかどうか
interface MyPluginSettings {
	fieldName: string;
	includeFrontmatter: boolean;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	fieldName: "url",
	includeFrontmatter: false,
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "externalize-selected-text",
			name: "Externalize selected text",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selectedText = editor.getSelection();
				const externalLinks = this.getExternalLinks();
				const externalizedText = this.externalizeText(
					selectedText,
					externalLinks
				);
				navigator.clipboard.writeText(externalizedText);
				new Notice("Externalized text was copied to clipboard!");
			},
		});

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "externalize-whole-page",
			name: "Externalize whole page",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				let wholePageText = view.data;
				if (!this.settings.includeFrontmatter) {
					wholePageText = wholePageText.replace(
						/---\n(.|\n)*?\n---\n/,
						""
					);
				}
				const externalLinks = this.getExternalLinks();
				const externalizedText = this.externalizeText(
					wholePageText,
					externalLinks
				);
				navigator.clipboard.writeText(externalizedText);
				new Notice("Externalized page was copied to clipboard!");
			},
		});

		// This creates an icon in the left ribbon.
		this.addRibbonIcon(
			"bracket-glyph",
			"Link Externalizer",
			(evt: MouseEvent) => {
				const editor =
					this.app.workspace.getActiveViewOfType(
						MarkdownView
					)?.editor;
				if (!editor) return;

				// 選択範囲があるか確認
				const selectedText = editor.getSelection();
				if (selectedText) {
					// 選択範囲がある場合、'externalize-selected-text' コマンドを実行
					this.app.commands.executeCommandById(
						"obsidian-link-externalizer:externalize-selected-text"
					);
				} else {
					// 選択範囲がない場合、'externalize-whole-page' コマンドを実行
					this.app.commands.executeCommandById(
						"obsidian-link-externalizer:externalize-whole-page"
					);
				}
			}
		);

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	private getExternalLinks() {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("No active file.");
			return;
		}

		const activeFileCache = this.app.metadataCache.getFileCache(activeFile);
		if (!activeFileCache || !activeFileCache.links) {
			new Notice("No links found in the active file.");
			return;
		}

		const externalLinks = {};

		activeFileCache.links.forEach((link) => {
			const fileName = link.link.split(/[#^|]/)[0];

			if (externalLinks[fileName]) return;
			externalLinks[fileName] = null;

			const linkedFile = this.app.metadataCache.getFirstLinkpathDest(
				fileName,
				"/"
			);
			if (!linkedFile) {
				console.log(link.link, "1. No linked file.");
				return;
			}
			// ファイルを取得
			const linkedFileCache =
				this.app.metadataCache.getFileCache(linkedFile);
			if (!linkedFileCache) {
				console.log(link.link, "2. No linked file cache.");
				return;
			}
			// ファイルの frontmatter を取得
			if (!linkedFileCache.frontmatter) {
				console.log(link.link, "3. No frontmatter found.");
				return;
			}
			const frontmatter = linkedFileCache.frontmatter;
			// frontmatter から url を取得
			if (!frontmatter.url) {
				console.log(link.link, "4. No url found.");
				return;
			}
			const url = frontmatter[this.settings.fieldName];

			externalLinks[fileName] = url;
		});

		return externalLinks;
	}

	private externalizeText(text: string, externalLinks: object) {
		const result = text.replace(/\[\[(.+?)\]\]/g, (match, p1) => {
			// #: link to heading
			// ^: link to block
			// |: alias
			const [linkText, alias] = p1.split("|");
			const fileName = linkText.split(/[#^]/)[0];
			const displayText = alias || linkText;
			if (!externalLinks[fileName]) return displayText;
			return `[${displayText}](${externalLinks[fileName]})`;
		});

		return result;
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Field name")
			.setDesc("field name to be used as url")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.fieldName)
					.onChange(async (value) => {
						this.plugin.settings.fieldName = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
