# Obsidian Link Externalizer

A plugin for Obsidian that converts internal links to external URLs based on frontmatter information, making your notes more portable and shareable outside of Obsidian.
[日本語版 README はこちら](docs/ja/README-ja.md)

## Features

-   **URL Conversion**: Automatically converts internal links to external URLs if the referenced note has a URL specified in its frontmatter
-   **Fallback Behavior**: Removes internal links if no URL is specified in the target note's frontmatter
-   **Multiple Link Format Support**: Works with both Markdown links and Wiki-style links
-   **Link Processing Options**: Supports both full document processing and selection-based processing

## Example

This plugin processes links in your current note by checking the frontmatter of referenced notes.

### Referenced Notes

1. Note with URL:

```md
---
title: obsidian
url: https://obsidian.md/
---

Local note about Obsidian
```

2. Note without URL:

```md
---
title: another-note
url:
---

Local note without url
```

### Link Conversion Example

Before:

```md
---
title: My Note
---

Obsidian is a great note-taking app!
Learn more about [[obsidian]].

You can also use it for [[another-note]] which has no URL in frontmatter.
```

After:

```md
---
title: My Note
---

Obsidian is a great note-taking app!
Learn more about [obsidian](https://obsidian.md/).

You can also use it for another-note which has no URL in frontmatter.
```

### Conversion Rules

-   Links to notes with a URL → Converted to external links
-   Links to notes without a URL → Link is removed, leaving only the text
