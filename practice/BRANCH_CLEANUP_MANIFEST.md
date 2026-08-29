# Branch cleanup manifest

Inventory of the 146 stale remote branches on `Mentis123/d3-agent-governance`, recorded
in preparation for deleting them. **The deletion has not been carried out** — see below.
At the time of recording: **44 already merged** into `main`, **102 never merged**.
There were no open pull requests at the time of recording, so deleting these branches
would close none.

Every commit SHA is recorded so any branch can be identified and, if GitHub still retains
the object, restored with `git branch <name> <sha>` or from the repository's branches page.
Merged branches carry no unique work — their commits already live in `main`.

## Deletion is still outstanding

Branch deletion could not be performed from the environment this inventory was produced in:
`git push --delete` is refused with HTTP 403 by that environment's git proxy, the GitHub REST
API is unreachable from it, and no delete-branch operation was available. To carry it out
from a machine with normal push rights:

```sh
git fetch --prune
git for-each-ref --format='%(refname:lstrip=3)' refs/remotes/origin \
  | grep -Ev '^(main|HEAD)$' \
  | xargs -n 25 git push origin --delete
```

Or, with the GitHub CLI:

```sh
gh api repos/Mentis123/d3-agent-governance/branches --paginate --jq '.[].name' \
  | grep -v '^main$' \
  | xargs -I{} gh api -X DELETE repos/Mentis123/d3-agent-governance/git/refs/heads/{}
```

| Branch | Tip SHA | Last commit | Status | Subject |
|---|---|---|---|---|
| `claude/add-ai-foundry-chatbot-01GJVsabotRbdRqpo43uiZmC` | `5877200a44` | 2025-11-30 | unmerged (126 ahead) | Add Azure AI Foundry chatbot integration |
| `claude/add-ai-practice-page-01J2rAaZNKFsjU7PedmrbRaL` | `f4bcc383a7` | 2025-12-08 | merged | Add AI Practice Plan page and update site navigation |
| `claude/add-ai-services-toc-01Afro35vQCL9PnJgzp8iSfa` | `c4826ef884` | 2025-12-01 | unmerged (178 ahead) | Add AI Services link to KB navigation in index.html |
| `claude/add-azure-foundry-support-016eiqev35d2oSPK81H5ieVt` | `4f4efdd5b3` | 2025-11-29 | unmerged (28 ahead) | Add Microsoft Foundry integration across all governance layers |
| `claude/add-control-matrix-legend-01H7X9h33WkaxGKmLQMuhWAr` | `68a859fbc1` | 2025-12-01 | unmerged (161 ahead) | Add legend at top and bottom of control matrix tables |
| `claude/add-data-glb-stripe-016qCjnB6aDyhdm9mXmZRhRi` | `fb0614d855` | 2025-11-30 | unmerged (101 ahead) | Add data.glb model to stripe page |
| `claude/add-digital-foundry-section-01A3CvYpoE7FbRRNv72MFxju` | `dda0753dfb` | 2025-12-11 | merged | Update Digital Foundry interface label to use IPT terminology |
| `claude/add-gtm-whiteboard-icon-019Uu3iXBa698CGHaKwxfk1K` | `95ec37415e` | 2025-12-04 | merged | Add GTM Whiteboard icon inline with play simulation button |
| `claude/add-hello-world-file-01APKNJktptaJj93aqBBwzjR` | `97eb788954` | 2025-12-10 | merged | Add hello_world.txt file |
| `claude/add-icons-desktop-ui-0138wSPRPdSHKoe5X28YMTg2` | `5171a4c04a` | 2025-11-30 | unmerged (70 ahead) | Add icon-based desktop UI for Knowledge Center and Simulation buttons |
| `claude/add-kb-icon-01MNgzVar3MiniuWcGgcEZLS` | `33921c1e50` | 2025-12-01 | merged | Update Knowledge Center header to use kb.png icon |
| `claude/add-kb-standalone-url-014tmH9LD13v3DxckPkvjzgZ` | `6c650a7daa` | 2025-11-30 | unmerged (74 ahead) | Add standalone /kb URL route for Knowledge Center |
| `claude/add-level-icons-mobile-01EucM3uxRNyVFLsB4Nrxs7u` | `f1f98053ba` | 2025-11-29 | unmerged (36 ahead) | Merge branch 'main' into claude/add-level-icons-mobile-01EucM3uxRNyVFLsB4Nrxs7u |
| `claude/add-mobile-book-icon-0184LGbjz3oP5w996N5iqXDo` | `75b9b8964f` | 2025-11-30 | unmerged (76 ahead) | Add mobile Knowledge Center book icon button |
| `claude/add-nav-links-012rntzHWkZooRLz43Xo7Zxj` | `d8884c6122` | 2025-12-08 | merged | Merge pull request #131 from Mentis123/claude/add-ai-practice-page-01J2rAaZNKFsjU7PedmrbRaL |
| `claude/add-section-logos-01KeZmBJPQmhBA6tgMstagkw` | `7941cf6d8d` | 2025-11-30 | unmerged (114 ahead) | Update welcome modal with custom logos and remove Quick Start Tips |
| `claude/add-services-easter-egg-01F228BbEf9osxtUJFsHARuZ` | `6f056d701f` | 2025-12-02 | merged | Add zoom controls to easter egg modal |
| `claude/add-splash-page-01S5SnRZTffhCisRsdNeVcaE` | `c3c484f316` | 2025-11-30 | unmerged (111 ahead) | Add welcome splash modal for first-time visitors |
| `claude/add-welcome-header-015vjkFMix3FSDyBTTwSMatN` | `9587522019` | 2025-12-01 | merged | Split welcome header text across two lines |
| `claude/ai-gtm-whiteboard-page-01EC7hgct1D1LpenVorNXto7` | `f9b7030bf7` | 2025-12-03 | unmerged (1 ahead) | Add AI GTM Strategy virtual whiteboard page |
| `claude/ai-gtm-whiteboard-page-01SbcrgGcsCH4EBjxJDUyVNN` | `f867342a91` | 2025-12-03 | merged | Add AI GTM Strategy virtual whiteboard page |
| `claude/azure-periodic-table-links-01MFmcD4WKRQyej9uTvk9tum` | `85f339d41e` | 2025-11-30 | unmerged (151 ahead) | Add CLAUDE.md and codex.md agent instruction files |
| `claude/center-phase-labels-0117sL5GyEirReL93mvC8KG2` | `528f1c6dcf` | 2025-12-01 | merged | Center phase labels under icons with larger font |
| `claude/chatbot-entraid-auth-016BtFsYWYyk3iBC6ZYETXuc` | `8b8b84e945` | 2025-12-01 | unmerged (175 ahead) | Add Entra ID authentication for chatbot |
| `claude/compact-grid-layout-01M5EAHph4Dedk2KiSMVeLgH` | `2bc122f18a` | 2025-12-01 | unmerged (173 ahead) | Redesign services map with super compact grid layout |
| `claude/compact-phase-layout-01UsXXPpWvVdsmtfZL51NWQX` | `4420b88ff7` | 2025-12-01 | unmerged (177 ahead) | Compact phase layout with colored borders and hero title |
| `claude/context-aware-chatbot-messages-013qgdT4L4XSAusjpP1Pq9hJ` | `4d1632ac65` | 2025-12-04 | merged | Add context-aware chatbot welcome messages for GTM pages |
| `claude/dynamic-layer-implementations-01RAocjCoLFvaHdygv12jZzU` | `010ea973eb` | 2025-11-29 | unmerged (33 ahead) | Move key implementations to left sidebar and make boxes dynamic |
| `claude/embed-mp3-standalone-html-cxborx` | `49a0411ab0` | 2026-08-01 | merged | Re-cut narration: longer takes, padded tails, measured chapters |
| `claude/enhance-services-map-01CTAgLPy9f4dvuVHckiNqfj` | `77fae5b213` | 2025-12-01 | unmerged (164 ahead) | Refocus services map on Data#3 service offerings |
| `claude/enlarge-fullscreen-logo-01TZ2BvoarFQy1vQ5ZUfXAFn` | `11e88215b1` | 2025-12-08 | merged | Add large hero logo to fullscreen chat mode |
| `claude/enlarge-pillars-icon-017xrzjPwPsA49AnmMAYWkGY` | `53d4a543b6` | 2025-11-30 | unmerged (70 ahead) | Simplify desktop Five Core Pillars header to single larger icon button |
| `claude/exit-icon-replacement-01TCd7vxj6GFHxrK8vujQtkD` | `ba30dd58a9` | 2025-11-30 | unmerged (96 ahead) | Change exit button to icon-only (remove text label) |
| `claude/expand-simulation-scenarios-01Qdw2TQXnJnRYCvq3zwJtNw` | `041e82fde0` | 2025-11-29 | unmerged (57 ahead) | Expand simulation to support three governance scenarios |
| `claude/export-kb-markdown-01NNajvJcgmvbDftaNdJMsJo` | `2300f29f9a` | 2025-11-30 | unmerged (124 ahead) | Add complete KB documentation as single markdown file |
| `claude/faster-threat-simulation-advance-01218qc8SNZcrdvEfn1F5Giw` | `d8a946336e` | 2025-11-30 | unmerged (144 ahead) | Update UI text to reflect 10s auto-advance timing |
| `claude/fix-5p-icon-click-01CVeGKzr2ys8QazfeHGYRmT` | `857e21fc3e` | 2025-11-30 | unmerged (159 ahead) | Fix 5P icon click by making chat widget container transparent to clicks |
| `claude/fix-ai-practice-duplicate-011tEXCWQFny2mp9ES8xmFBJ` | `d7b4005055` | 2025-12-09 | merged | Fix catch-all route intercepting static HTML file requests |
| `claude/fix-ai-practice-routing-0172kEPvYdjQFXyXRrSdLUZq` | `3adc63806d` | 2025-12-09 | merged | Revert routing changes - issue was Azure deployment storage |
| `claude/fix-azure-deployment-0186DfBLnUv9CvFjzF6rNhLX` | `9dd9e36ae5` | 2025-11-29 | unmerged (3 ahead) | Fix Azure deployment for static HTML site |
| `claude/fix-build-failure-01NqhFWBGC3QTebCvmYDvKMV` | `6c97977301` | 2025-11-29 | unmerged (7 ahead) | Add package-lock.json to fix CI build failure |
| `claude/fix-button-padding-01QSVqoNedu4HCGmHhoDrQ4r` | `a41e1700f5` | 2025-11-30 | unmerged (81 ahead) | Make icons fill their button boxes completely |
| `claude/fix-compact-view-layout-01Mvk3pqZa8SfSufNBgEbsgM` | `57b549daca` | 2025-12-01 | unmerged (206 ahead) | Fix compact view layout to match original design |
| `claude/fix-evaluation-box-width-01RZBMB6MaNkZp3nBfHYUVod` | `d64f8de66f` | 2025-12-01 | merged | Fix pillar boxes to have equal height in expanded view |
| `claude/fix-expanded-view-017YJM6mXQ2oapmqdKuiXS4o` | `82c2329a5e` | 2025-12-01 | unmerged (187 ahead) | Restore expand/collapse toggle functionality for services map |
| `claude/fix-expanded-view-layout-01Dy4Krwsy1XTdXkAz5bwTkD` | `275e489a23` | 2025-12-01 | merged | Fix expanded view to show all 6 phases in one row |
| `claude/fix-fullscreen-chat-box-01DBWQChq8fhXD8NynT3za5E` | `f6776c892e` | 2025-12-05 | merged | Fix fullscreen chat: expand input width, update icon and placeholders |
| `claude/fix-governance-framework-title-01TtX2srbz3Kenemrei6Xc3M` | `8f26c1f84d` | 2025-12-01 | merged | Update welcome modal title to Data#3 Enterprise Agent Governance Framework |
| `claude/fix-grid-reference-error-01YDkgYeZh8mjJ8TX8VfmzFk` | `8ba82d5093` | 2025-12-01 | unmerged (183 ahead) | Fix Grid icon not defined error |
| `claude/fix-gtm-tile-labels-0178cMkYhVhmHRWLJxSV6dFs` | `53b0c1a50d` | 2025-12-12 | merged | Fix GTM Phases tile label visibility |
| `claude/fix-hashtag-subtitle-styling-01BvTCeYWtRzbrwR8m54mt7r` | `677dd2e846` | 2025-12-01 | unmerged (168 ahead) | Fix hashtag superscript styling and update subtitle |
| `claude/fix-hover-text-position-01UqjE72uFZLLbQQQkqnS3TS` | `37f7df47b8` | 2025-11-30 | unmerged (81 ahead) | Fix hover tooltip z-index to appear on top of other elements |
| `claude/fix-hover-textbox-z-index-01EytvX5yJb43JS5s1TmgHYt` | `78acb1b820` | 2025-12-01 | unmerged (214 ahead) | Restore section stacking context fix for hover tooltips |
| `claude/fix-icon-backgrounds-019mfV48H5uDJg6BfSGtNsjE` | `c0d42e1103` | 2025-11-30 | unmerged (113 ahead) | Fix icon backgrounds and sizing consistency in header |
| `claude/fix-icon-images-01NTm7WxDVsfQeKRfh3hnSiF` | `f1e48546b3` | 2025-11-30 | unmerged (118 ahead) | Update KB section headers to use correct logo images |
| `claude/fix-image-stretching-018uHVSqNBgwrPnckGBfdkeE` | `dfad6655a2` | 2025-12-02 | merged | Fix image stretching in easter egg modal |
| `claude/fix-image-toggle-016k5RUPeYe56yg2iL8ejqWq` | `f0a3066961` | 2025-12-01 | unmerged (183 ahead) | Fix 5p_logo_off.png rendering as white square |
| `claude/fix-kb-blank-page-01HZKG6WsoHuCtv7vgi1LmNL` | `7ddeba0af7` | 2025-12-01 | unmerged (185 ahead) | Fix ExternalLink icon not defined error in KB |
| `claude/fix-layout-scaling-01MwYJU9gekr4twoG86aCSKS` | `814565f4bf` | 2025-12-03 | merged | Fix modal sizing and zoom behavior |
| `claude/fix-mobile-pillar-controls-01KF6nidDfXtGk6N6RgAyEhb` | `f1dece21d9` | 2025-11-30 | unmerged (129 ahead) | Fix mobile UI for pillar controls and chatbot |
| `claude/fix-mobile-pillars-icon-01PYuf5eE6eQZAExtMzeKDQ2` | `4091c99cc4` | 2025-11-30 | unmerged (157 ahead) | Fix mobile pillar icon being blocked by chat widget |
| `claude/fix-mobile-play-icon-01C7AiQG3c2vFC3XsYf7GA6X` | `4ea5f8228d` | 2025-11-30 | unmerged (120 ahead) | Fix mobile play icon size to match KB button dimensions |
| `claude/fix-mobile-responsiveness-01Gjhb8XRTZGGkuoXXZhRsDn` | `d6de754e0c` | 2025-11-29 | unmerged (66 ahead) | Fix mobile responsiveness for Knowledge Center |
| `claude/fix-mobile-run-text-01KnpjANJitJxSogFZgGv9jv` | `e372e8e1b7` | 2025-11-30 | unmerged (118 ahead) | Remove Run text from mobile play button, show only icon |
| `claude/fix-mobile-ui-issues-01FfGZdzaBz6bymc8HjM6GsR` | `17f4222e63` | 2025-11-30 | unmerged (146 ahead) | Fix mobile UI issues: play button bg color and pillars FAB responsiveness |
| `claude/fix-popup-z-index-014ssYpmsUg1ng9CdaPgeY1h` | `ad82403537` | 2025-12-01 | unmerged (193 ahead) | Fix popup z-index to appear above all other elements |
| `claude/fix-popup-z-index-01AKmChnth5HfKdn28XrDmkW` | `9d40a9196b` | 2025-12-01 | unmerged (197 ahead) | Fix tooltip z-index by elevating parent section on hover |
| `claude/fix-popup-z-index-01YQeG7eb44od9TBGh2rzn23` | `efce46c01f` | 2025-12-01 | unmerged (187 ahead) | Fix popup z-index and background opacity in services_map.html |
| `claude/fix-prometheus-agent-011Tddr9r6tusaKnQhnUnCt7` | `cd29659196` | 2025-12-11 | merged | Fix Prometheus Agent endpoint configuration |
| `claude/fix-root-routing-01KuNZRa6Rsr7QK4qMvys5x3` | `11c7de8855` | 2025-11-29 | unmerged (5 ahead) | Fix root routing by adding Express server for static file serving |
| `claude/fix-security-scenarios-013tyFzGN1W81zci6Tuh3JF1` | `4058155829` | 2025-11-29 | unmerged (68 ahead) | Add missing Shadow IT Agent scenario to Knowledge Center |
| `claude/fix-stripe-page-01XFPqPeeHbG9W7U38eXbpu6` | `4dad71b8c8` | 2025-11-30 | unmerged (96 ahead) | Fix React errors on stripe page |
| `claude/fix-stripe-react-error-01T1SGK3YRjCb8YpuEoCsVPm` | `fe6dda4281` | 2025-11-30 | unmerged (101 ahead) | Fix React error #62 in stripe.html by using drei Line component |
| `claude/fix-stripe-react-error-01WbM5F2t2oFrviWfDjDbbBq` | `91e608c70b` | 2025-11-30 | unmerged (107 ahead) | Fix React error #62 by adding explicit boolean values to htm props |
| `claude/fix-timer-cadence-message-01FEtBfZ9oKh9jBky8tNgPaA` | `99faaac5dc` | 2025-12-01 | merged | Remove cadence badge and fix timer message to 10s |
| `claude/fix-tooltip-z-index-015TPNo3LJQsz27vnv4vwBSV` | `9bf2247316` | 2025-12-01 | unmerged (210 ahead) | Fix tooltip z-index and restore expanded view functionality |
| `claude/flip-expanded-view-layout-016R4zTiVDNzSraDuN4jzdbF` | `b6ab966c3b` | 2025-12-01 | unmerged (204 ahead) | Flip expanded view layout: Layers, Pillars, Title |
| `claude/format-chatbot-responses-019CygzPGKXzBhsCjM4tU76g` | `62a72bcefb` | 2025-11-30 | unmerged (133 ahead) | Add markdown formatting support for chatbot responses |
| `claude/foundry-agent-chatbot-01XZcJER3QBUSHNVQvybVhkR` | `59257b6665` | 2025-12-11 | merged | Make Foundry Agent Service link invisible (secret link) |
| `claude/foundry-agent-page-context-01HYFpqnGd8oFwn3tuwHfRBh` | `6bb72f091d` | 2025-12-05 | merged | Add page context to Azure AI Foundry agent requests |
| `claude/fullscreen-chat-overlay-01UNYhiDfptbR7JfiLBpfCxf` | `9f2653ae49` | 2025-12-05 | merged | Add fullscreen chat overlay mode with copy message feature |
| `claude/gather-debug-logs-01Ha1EhyZpBKnmjAGgWfNH9U` | `692e8db818` | 2025-11-30 | unmerged (129 ahead) | Add debug logging for agent-chat API errors |
| `claude/governance-framework-doc-01VPvoV5884HNwbkVVjncJAP` | `fd4e4cddbb` | 2025-11-29 | unmerged (55 ahead) | Add comprehensive governance framework documentation |
| `claude/gtm-title-chatbot-link-01THtLT3PEDioWFa2LrBK1Ki` | `8aaf2236b4` | 2025-12-04 | merged | Hide GTM link styling - no visual indication of clickability |
| `claude/hide-chatbot-by-default-015BcUBSktNoVrTBqZWPb6gN` | `5acbdac512` | 2025-12-01 | unmerged (175 ahead) | Hide chatbot by default with secret trigger in KB footer |
| `claude/hide-floating-icon-mobile-01LMPsaJDAfbnZAqCrBuwttd` | `01616ea88c` | 2025-11-29 | unmerged (59 ahead) | Hide 5p floating icon on mobile during simulations |
| `claude/improve-pillar-layout-01Lhecp2tbvaj7fMp2qFPc1S` | `468344819b` | 2025-12-01 | merged | Improve pillar layout visibility and styling |
| `claude/level-color-scheme-01FS7ZWjPCJx7m3rSyUUEozY` | `d82502a5b5` | 2025-11-29 | unmerged (21 ahead) | Add level color scheme with pillar-aligned bullet system |
| `claude/mobile-friendly-improvements-01XbmxnVPTBQmLPjU6hfMUc2` | `ce1c26d95c` | 2025-11-29 | unmerged (9 ahead) | Add comprehensive mobile-friendly improvements |
| `claude/phase-1-staffing-plan-01W1Gvkep3x2ymFT4qYNHWhP` | `051e98401c` | 2025-12-11 | merged | Add FDE Services count to 3-Phase Scaling Model |
| `claude/pillars-default-selected-01NwQRGJ7x8CDbfDAqsDoBhJ` | `da64daa400` | 2025-11-29 | unmerged (31 ahead) | Replace mobile drawer with floating pill bar for pillar toggles |
| `claude/refactor-levels-to-layers-01QFvqHBaJ1bLm46y7CodqXc` | `5e94f29302` | 2025-11-30 | unmerged (83 ahead) | Refactor: Replace LEVELS with LAYERS terminology throughout |
| `claude/remove-commercial-targets-01Ayx9fvGFjLtn5YAZrNUgrh` | `886d742553` | 2025-12-12 | merged | Hide Commercial Targets and Core Service Lines in compact view |
| `claude/remove-exit-door-link-01BidZBmk1oCqs8Lm5pH1SvU` | `a96fae1339` | 2025-11-30 | unmerged (109 ahead) | Remove exit door link/icon from header |
| `claude/remove-legend-update-colors-015t2KKNp116X7HJ3z2bdLZK` | `78b331cc3c` | 2025-11-29 | unmerged (23 ahead) | Remove pillar legend and add individual pillar colors |
| `claude/remove-logo-kb-link-01Di5QpZn2GZ53j59d4zSYN9` | `5d2138cecc` | 2025-11-30 | unmerged (137 ahead) | Remove KB link from logo icon in header |
| `claude/remove-services-map-layers-017uzXd8x91nHxFVyoxTVNb1` | `72536c17ba` | 2025-12-02 | merged | Remove architecture layers from services map |
| `claude/reorder-project-phases-01P95PW2GZCXw7M8rwPKfonr` | `afaac0e29f` | 2025-12-03 | merged | Reorder AI Services Lifecycle phases |
| `claude/reorganize-fde-layout-01Po9NbPGbyzhgYq7QSAfGVE` | `14d1d64cbf` | 2025-12-01 | unmerged (166 ahead) | Reorganize FDE layout and update branding |
| `claude/reposition-pillars-button-mobile-01FBSHYM6DeR7cMJJgrhT9Qo` | `79487f909a` | 2025-11-30 | unmerged (135 ahead) | Move pillars button to bottom right on mobile |
| `claude/research-compact-view-01BPFG1SokvmTkMR56GNuhPN` | `c9a3ecca45` | 2025-12-11 | merged | Add compact/expand view toggle to AI Practice page |
| `claude/reset-splash-preference-01VR3VH6pHtLnnNqPHXxNokD` | `d99480e813` | 2025-11-30 | unmerged (133 ahead) | Add easter egg to reset splash screen preference |
| `claude/resize-icons-reorganize-levels-017vsGiDmrkyCSu2E55QgaLs` | `bc84c56ef0` | 2025-11-29 | unmerged (35 ahead) | Resize header and pillars icons, reduce spacing in levels section |
| `claude/restore-compact-view-01AYrj1yxRbk5QsPAwsuLh8n` | `7593694c76` | 2025-12-01 | unmerged (208 ahead) | Restore original compact view design with hover tooltips |
| `claude/restore-expanded-view-01Gv4hKiWJd5irekzZVn2cgn` | `6597aaacac` | 2025-12-01 | unmerged (215 ahead) | Keep 'Delivering AI Services Securely' title in both views |
| `claude/restore-fde-bar-layout-014y5sDv5CZA397LDfZ8jWMo` | `638a89e458` | 2025-12-01 | unmerged (199 ahead) | Restore FDE bar in expanded view under services landscape |
| `claude/restore-fde-bar-layout-01XZDoPAbfb54QvN6pNKaoD8` | `798f99a29b` | 2025-12-01 | unmerged (202 ahead) | Start services map in compact mode by default |
| `claude/restore-gold-bar-expanded-01Xh6DUBsE1sgDDGKvCwz8bM` | `827566328f` | 2025-12-01 | merged | Restore FDE gold bar in expanded view only |
| `claude/review-feedback-guide-01JjtRuGNNGCu9cK1HgGGVru` | `dc9e91ae0e` | 2025-12-01 | unmerged (172 ahead) | Update package-lock.json with @neondatabase/serverless |
| `claude/security-scenarios-updates-011A6davKv3NWDydXDYndiYk` | `3f089aefde` | 2025-11-30 | unmerged (71 ahead) | Use pillar icons for layer color coding in security scenarios |
| `claude/services-map-toggle-01EBdFmk4dCBkbYdahSkJBJy` | `53f1c7309f` | 2025-12-01 | unmerged (171 ahead) | Add expand/collapse toggle for services map view |
| `claude/style-middle-boxes-012nQVykR6PsSCybG3MXHzp3` | `7f868f1e49` | 2025-12-01 | unmerged (187 ahead) | Style middle layer boxes to match top/bottom design |
| `claude/sync-services-map-docs-01SGs4JKzsg39MLfYbFpwjh2` | `92dc20af9e` | 2025-12-01 | unmerged (210 ahead) | Add AI Services Lifecycle and enhance pillar/layer docs |
| `claude/update-ai-messaging-01RssFAmDqHBAutV6bzg8N1N` | `0cda377eb9` | 2025-12-02 | merged | Update tagline from 'Delivering AI Services Securely' to 'Delivering AI Securely' |
| `claude/update-icon-images-01R95CqkS7YGT34Ntswwe6jP` | `b91ffc9ad7` | 2025-11-30 | unmerged (79 ahead) | Update KB and Play icons to use new PNG images |
| `claude/update-logo-image-01H2sda8kzPC3BFdq7wMpsh8` | `4f1f94d8a5` | 2025-11-29 | unmerged (24 ahead) | Update header logo to use g_logo.jpg |
| `claude/update-services-map-link-01E4Emygiw3oHjVfYmfYGfe6` | `4141337f82` | 2025-12-03 | merged | Update services map link to open in new tab with updated text |
| `claude/wiki-popup-console-01Aj3seHUBzCeoiKvNWc7axT` | `59843bd42a` | 2025-11-29 | unmerged (62 ahead) | Merge main into wiki-popup-console branch |
| `codex/add-dark-mode-and-copy-buttons` | `9f11e2aff6` | 2025-12-04 | merged | Add dark mode and copy helpers to GTM views |
| `codex/add-dark-mode-background-to-gtm_strategy.html` | `e0f3d59c6c` | 2025-12-04 | merged | Ensure GTM strategy page has dark background |
| `codex/add-global-toggle-component-for-pillars` | `e354e80970` | 2025-11-30 | unmerged (43 ahead) | Add global five-pillar toggle controls |
| `codex/add-gtm_strategy_phases-html-page` | `58948547e2` | 2025-12-04 | merged | Add GTM phases view and navigation links |
| `codex/add-navigation-buttons-to-simulation` | `6d59df3a10` | 2025-11-29 | unmerged (11 ahead) | Add play controls to simulation trace |
| `codex/add-question-mark-icon-for-pillars-legend` | `770b6dc74d` | 2025-11-30 | unmerged (51 ahead) | Add mobile pillar legend toggle |
| `codex/add-route-for-stripe.html-bundle` | `e1612d7d9f` | 2025-11-30 | unmerged (90 ahead) | Add explicit Stripe route |
| `codex/add-stripe.html-with-3d-visualization` | `82c48e9bc0` | 2025-11-30 | unmerged (83 ahead) | Add navigation links between stripe hub and simulations |
| `codex/add-stripe.html-with-3d-visualization-h122lp` | `4a2018ea4e` | 2025-11-30 | unmerged (94 ahead) | Merge branch 'main' into codex/add-stripe.html-with-3d-visualization-h122lp |
| `codex/add-touch-selection-for-level-area` | `37a7d8f193` | 2025-11-30 | unmerged (47 ahead) | Improve mobile layer selection affordance |
| `codex/adjust-play-box-size-to-match-kb-icon` | `6627ba683a` | 2025-12-01 | unmerged (155 ahead) | Align simulation button sizing with KB icon |
| `codex/align-exit-icon-with-kb-and-play` | `ac23859cd4` | 2025-11-30 | unmerged (101 ahead) | Tighten header control sizing for parity |
| `codex/change-navigation-behavior-on-mobile` | `093a243e69` | 2025-11-30 | unmerged (51 ahead) | Adjust mobile layer selection navigation |
| `codex/fix-mobile-chat-input-scrolling-issue` | `ade0d4d8be` | 2025-12-01 | unmerged (146 ahead) | Improve mobile chat widget input usability |
| `codex/fix-mobile-text-and-button-layout` | `b5b957119c` | 2025-11-30 | unmerged (141 ahead) | Improve mobile chat layout stability |
| `codex/fix-pop-up-z-index-issue-on-services-map` | `c6012b7822` | 2025-12-01 | unmerged (195 ahead) | Ensure service map tooltips overlay adjacent cards |
| `codex/optimize-d3-governance-knowledge-center-for-mobile` | `7aeaf7efd6` | 2025-11-30 | unmerged (64 ahead) | Improve mobile layout for knowledge center |
| `codex/populate-gtm_strategy_phases.html-with-phases-data` | `e697fc839c` | 2025-12-04 | merged | Populate GTM phases from CSV data |
| `codex/refactor-section-wrappers-and-grids` | `ba8e02f6cc` | 2025-12-04 | merged | Improve GTM section layout |
| `codex/remove-next-button-and-make-steps-clickable` | `51f4e192af` | 2025-11-29 | unmerged (13 ahead) | Enable clickable simulation steps |
| `codex/replace-and-verify-images-in-index.html` | `9030cd49c3` | 2025-11-30 | unmerged (41 ahead) | Update header and pillar logos to png assets |
| `codex/replace-burger-bar-with-square-logo` | `6c8ba185d4` | 2025-11-29 | unmerged (15 ahead) | Add five pillars logo to navigation |
| `codex/replace-five-pillars-svg-with-img_6247.jpeg` | `ed7f2315fc` | 2025-11-29 | unmerged (19 ahead) | Replace five pillars logo image |
| `codex/style-play-button-to-match-kb-button` | `550e757e2c` | 2025-12-01 | unmerged (150 ahead) | Align play button styling with KB control |
| `codex/update-mobile-icon-logic-for-pillars` | `1f8ca24155` | 2025-11-30 | unmerged (49 ahead) | Update mobile pillar icons |
| `codex/update-mobile-pillar-bar-component` | `19426018b5` | 2025-11-30 | unmerged (45 ahead) | Add global toggle to mobile pillar bar |
| `codex/update-owner-display-on-gtm_strategy_phases.html` | `a9f952a583` | 2025-12-04 | merged | Merge branch 'main' into codex/update-owner-display-on-gtm_strategy_phases.html |
| `codex/update-styles-for-dark-theme` | `8af3de47a0` | 2025-12-04 | merged | Apply dark theme to GTM strategy whiteboard |
