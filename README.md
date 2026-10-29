# Tales Unwritten: Interactive Fantasy Storytelling

An interactive website companion to the dissertation **Interactive Storytelling using Large Language Models**
(Kirtan Ajitbhai Chanllawala, BSc Computing Science, University of Stirling, 2025).

- **Story Studio**: pick a hero, class and realm, then shape a branching fantasy tale with three choices per chapter or any free-text action.
- **Chronicle**: live state tracking of characters, places, items and the quest, fed back to the model every turn.
- **Scene art**: a built-in procedural fantasy scene generator (forests, castles, caves, dragons, ruins, seas and more, with a hero silhouette per class); a gallery of ten realms, endless variations, a "conjure from text" tool and SVG download.
- **Narration, export, save**: browser text-to-speech, Markdown export, autosave.
- **Analytics and ratings**: lexical diversity, sentence length and Fantasy Vocabulary Density, plus the four-dimension rating form with CSV export.
- **Research**: charts built from the dissertation's reported results, and a map of which limitations and future-work items this site completes.

Plain HTML, CSS and JavaScript. No build step, no dependencies, about 100 KB in total.

## Story engines

| Engine | Needs | Notes |
|---|---|---|
| Mistral (live) | A free API key from [console.mistral.ai](https://console.mistral.ai) | Used in the browser only; the key is never stored in this repo. Model: `mistral-small-latest`. |
| Offline tale | Nothing | "The Hollow Crown", a hand-written branching story. Also the automatic fallback. |

No GPT/OpenAI API is used. The dissertation's own fine-tuned Mistral model is not hosted here.

## Run locally

Open `index.html` in a browser, or serve the folder with any static server.

## Publish on GitHub Pages

1. Create an empty repository, for example `fantasy-storytelling`.
2. Upload everything in this folder (drag and drop on github.com works), keeping the `.github` folder.
3. In **Settings > Pages**, set **Source** to **GitHub Actions**. The included workflow deploys on every push to `main`.
4. Your site appears at `https://<your-username>.github.io/<repo-name>/`.

## Services used

- `api.mistral.ai`: story text, only when you supply a key.
- Google Fonts.

Scene art is generated locally in the browser; there is no image API.

## Licence

MIT. See `LICENSE`. Dissertation content remains the author's work.
