import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	parseLinktext,
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
						/^---\n[\s\S]*?\n---\n/,
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

	private getExternalLinks(): Record<string, string> {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("No active file.");
			return {};
		}

		const activeFileCache = this.app.metadataCache.getFileCache(activeFile);
		if (!activeFileCache || !activeFileCache.links) {
			new Notice("No links found in the active file.");
			return {};
		}

		const externalLinks: Record<string, string> = {};
		const fieldName =
			this.settings.fieldName?.trim() || DEFAULT_SETTINGS.fieldName;
		let resolvedLinkFound = false;

		for (const linkMeta of activeFileCache.links) {
			console.log(linkMeta);
			const fileName = linkMeta.link;
			if (externalLinks[fileName]) continue;

			// ファイルを取得
			const linkedFile = this.app.metadataCache.getFirstLinkpathDest(
				fileName,
				"/"
			);
			if (!linkedFile) continue;
			const linkedFileCache =
				this.app.metadataCache.getFileCache(linkedFile);
			if (!linkedFileCache) continue;
			// ファイルの frontmatter を取得
			if (!linkedFileCache.frontmatter) continue;
			const frontmatter = linkedFileCache.frontmatter;
			// frontmatter から指定されたフィールド名の値を取得
			const url = frontmatter[fieldName];
			if (!url) continue;

			externalLinks[fileName] ??= url;
			resolvedLinkFound = true;
		}

		if (!resolvedLinkFound) {
			new Notice(`No '${fieldName}' values found in linked frontmatter.`);
		}

		return externalLinks;
	}

	private externalizeText(
		text: string,
		externalLinks: Record<string, string>
	) {
		const result = text.replace(/\[\[(.+?)\]\]/g, (match, inner) => {
			const pipeIndex = inner.indexOf("|");
			const target = pipeIndex === -1 ? inner : inner.slice(0, pipeIndex);
			const alias = pipeIndex === -1 ? "" : inner.slice(pipeIndex + 1);
			const { path } = parseLinktext(target);
			const fileName = path || target.split(/[#^]/)[0];
			const displayText = alias || this.stripLinkDisplay(target);
			const baseUrl = externalLinks[fileName];
			if (!baseUrl) return displayText;

			return `[${displayText}](${baseUrl})`;
		});

		return result;
	}

	private stripLinkDisplay(linkText: string) {
		if (!linkText) return "";
		if (linkText.startsWith("#") || linkText.startsWith("^")) {
			return linkText.slice(1);
		}
		const anchorIndex = linkText.search(/[#^]/);
		if (anchorIndex === -1) return linkText;
		return linkText.slice(0, anchorIndex);
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
