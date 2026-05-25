# alitafakkor.github.io

Personal academic website of Ali Tafakkor — Ph.D. student in Neuroscience at Western University.

Live at **[alitafakkor.github.io](https://alitafakkor.github.io)**

---

## Stack

- **Jekyll** static site, deployed via GitHub Pages
- Custom layouts and CSS (no remote theme)
- YAML-driven content (`_data/`) for publications, news, projects, and hobbies
- Interactive 3D brain wireframe rendered on a `<canvas>` from a GIFTI fs_LR 32k mesh
- Light / dark mode with `localStorage` persistence

## Project structure

```
.
├── _config.yml          # Site settings (title, social links, avatar, etc.)
├── _data/
│   ├── publications.yml # Journal/conference publications
│   ├── news.yml         # News & updates
│   ├── projects.yml     # Instruments & Investigations sections
│   └── hobbies.yml      # "Beyond the Lab" hobby cards
├── _layouts/
│   ├── landing.html     # Main single-page layout
│   └── page.html        # Inner-page layout (breadcrumb nav)
├── assets/
│   ├── css/
│   │   └── landing.css  # Design tokens + all component styles
│   ├── js/
│   │   └── brain.js     # 3D brain wireframe renderer
│   ├── data/
│   │   └── brain_mesh.json  # fs_LR 32k midthickness mesh (both hemispheres)
│   └── img/             # Avatar, favicon, hobby card thumbnails
├── index.html           # Homepage (front matter drives all content)
└── tmux.html            # tmux cheat sheet inner page (/tmux/)
```

## Running locally

Requires Ruby and Bundler.

```bash
bundle install
bundle exec jekyll serve
```

Then open <http://localhost:4000>.

## Customising content

All content is driven by YAML files in `_data/` and front matter in `index.html` — no layout editing needed for routine updates.

| File | Controls |
|---|---|
| `_config.yml` | Name, position, affiliation, social links, avatar |
| `index.html` front matter | Intro heading, about text, research cards |
| `_data/publications.yml` | Publications list |
| `_data/news.yml` | News items |
| `_data/projects.yml` | Instruments & Investigations cards |
| `_data/hobbies.yml` | Beyond the Lab hobby cards |

## License

Source code: [MIT](LICENSE)  
Content (text, images): © Ali Tafakkor
