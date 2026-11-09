# Brain embedding and provider feasibility

Brain runs as a React island in Astro, inside the existing shell/theme/navigation.
No Next.js server, Cytoscape, graph-layout package, Laravel service, database,
Skills catalog or OpenAPI integration is required or added. Existing dashboard
React/Astro packages retain their recorded licenses; no new dependency is used.

Graph/provider roots are the localhost API's bounded `storage/brain-data/` JSON
reader. No private export or upstream dataset is shipped. Operators may supply
first-party or otherwise authorized exports. This is a file-backed adaptation of
the pinned source UI's hooks, not a promise that its deployment APIs exist here.

| Source surface | Local implementation/provider decision |
|---|---|
| Tabs / graph / filters / legend / sidebar | `manifest.json` tabs and graph nodes/edges; bounded in-memory page/window. |
| Usages | Incoming/outgoing snapshot edges, with links to related nodes. |
| Source | Optional `providers.source` JSON indexed by source path; plain text only. |
| History / side-by-side diff | Optional `providers.history`, indexed by path with revision/content records. |
| Flowchart | Node `data.flowSteps` or optional `providers.flow`, indexed by node ID. |
| Sequence | Snapshot edges or optional `providers.sequence`, indexed by node ID. |
| AI rules | Optional static `providers.aiRules`; no model call or Skills integration. |
| Complexity / risk | Recorded metrics and snapshot rankings; no security-certification claim. |
| Stress | Upstream executes against a live Laravel app. No such provider is configured; show unavailable, never simulate a successful test. Authorized snapshot results may be reviewed separately. |
| Export / theme / virtual store | Browser-generated JSON export, shared theme, bounded in-memory state; no snapshot content saved to browser storage. |

Example manifest contract (operator input, not a bundled dataset):

```json
{"date":"YYYY-MM-DD","tabs":[{"id":"owned","label":"Owned project","file":"graphs/owned.json"}],"providers":{"source":"providers/source.json","history":"providers/history.json","flow":"providers/flow.json","sequence":"providers/sequence.json","aiRules":"providers/rules.json"}}
```

Graphs have `meta`, `nodes` (`id`, `label`, `type`, `data`) and `edges` (`source`,
`target`, optional `id`/`type`/`label`). Duplicate node IDs fail; dangling edges
are omitted with a visible count. Limits: 20,000 nodes / 50,000 edges, at most
200 rendered nodes per window; existing 5 MB per-file and 16 MB request limits
remain. JSON files and tab IDs are validated; provider URLs cannot escape the
private JSON root or become external fetches. Missing providers are explicit
unavailable states. Read-only GETs never run an application or collect telemetry.
