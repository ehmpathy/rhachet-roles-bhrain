## 🔭 researcher

- **scale**: a question the repo cannot answer from what it holds
- **focus**: probe, absorb, remit — until the gaps close
- **maximizes**: coverage of the unknown, at the fewest probes

used to discover what is **not yet held**, so the librarian has knowledge to curate.

### the seam with the librarian

📚 and 🔭 are two faces of one knowledge practice, split on one question:

| role | operates on | the question |
|---|---|---|
| 📚 **librarian** | what the repo **already holds** | *"where does this belong, and how is it found?"* |
| 🔭 **researcher** | what the repo does **not yet hold** | *"what do we not know, and how do we find out?"* |

⇒ the handoff is the route's last phase — `briefs.curate` — where discovered knowledge becomes a
brief and the librarian's rules take over.

### the route

`init.research` lays a thought route with five phases:

| phase | what happens |
|---|---|
| 1. **probes.aim** | formulate the questions — internal recall, then external search, then blended |
| 2. **probes.emit** | dispatch parallel subagents, one per probe |
| 3. **probes.absorb** | synthesize the yields into kernels, then clusters, then **gaps** |
| 4. **probes.remit** | one supplemental probe per gap; iterate until returns diminish |
| 5. **briefs.curate** | externalize what was found into briefs — the librarian's handoff |

⚠️ **phase 3's gap list is what earns the role.** a search that returns answers is a search; a
search that returns **what it still cannot answer** is research. the first pass never closes every
gap, so a researcher who stops there reports coverage it does not have.

### skills

| skill | purpose |
|---|---|
| `init.research` | lay a `.research/` route with the five phases above |

```sh
npx rhachet run --repo bhrain --role researcher --skill init.research --name consensus-algorithms
```
