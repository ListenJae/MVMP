# MVMP

MVMP is a Minecraft multiplayer companion project for hosting a private server, mirroring in-game activity to Discord, and publishing selected Discord channel information to a web page.

## Project Areas

- `infra/minecraft`: Docker-based Paper Minecraft server hosting.
- `plugins/mvmp-discord-bridge`: Paper plugin that forwards server events and chat to Discord.
- `apps/discord-worker`: Discord bot worker that syncs selected channel messages into web-readable JSON.
- `apps/discord-web`: Web app that can display Discord channel data.

## Quick Start

### One-Click Scripts

Double-click these files from the project root:

- `start-all.bat`: starts the Minecraft server, Discord worker, and web app.
- `start-minecraft-server.bat`: builds the plugin, copies it into the server plugins folder, and starts Minecraft.
- `stop-minecraft-server.bat`: stops the Minecraft server.
- `start-discord-worker.bat`: syncs Discord channel messages into persistent local history and web feed files.
- `start-web.bat`: starts the MVMP web page at `http://localhost:3000`.
- `build-plugin.bat`: builds and copies the Minecraft plugin jar.
- `update-dependencies.bat`: installs npm dependencies and verifies the web/plugin builds.

Before running Discord features, edit `.env` and fill in:

- `DISCORD_WEBHOOK_URL`
- `DISCORD_BOT_TOKEN`
- `DISCORD_CHANNEL_ID`
- `MVMP_WORLDS`

### Manual Commands

1. Copy the example environment file.

   ```powershell
   Copy-Item .env.example .env
   ```

2. Edit `.env` and fill in the Discord values.

3. Start the Minecraft server.

   ```powershell
   .\.tools\node\npm.cmd run server:up
   ```

4. Build the plugin.

   ```powershell
   .\.tools\node\npm.cmd run build:plugin
   ```

5. Copy the generated plugin jar into `infra/minecraft/plugins`, then restart the server.

6. Sync Discord channel messages for the web app.

   ```powershell
   .\.tools\node\npm.cmd run dev:worker
   ```

7. Start the web app.

   ```powershell
   .\.tools\node\npm.cmd run dev:web
   ```

If you want the local `node`, `npm`, `java`, and `gradle` commands available directly in a PowerShell session, run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
. .\scripts\use-local-tools.ps1
```

## Notes

- The Minecraft server uses the Paper image from `itzg/minecraft-server`.
- The bridge plugin currently sends chat, joins, leaves, deaths, and server lifecycle events to a Discord webhook.
- The Discord worker stores persistent local history in `apps/discord-worker/data/mvmp-store.json`.
- The worker exports web-readable files under `apps/discord-web/public/data`, including world lists, world feeds, player status, and event logs.

## Worlds And History

The bridge plugin sends Minecraft messages with a world prefix:

```text
[world] <Steve> hello
[world_nether] Steve left the server.
```

The Discord worker reads that prefix and stores messages under the matching web world page.
Messages without a prefix go to the configured fallback world.

Configure the fallback world and shared Discord channel in `.env`:

```env
DISCORD_CHANNEL_ID=123456789012345678
MVMP_WORLDS=main:DISCORD_CHANNEL_ID:Main World:Fallback world for messages without a [world] prefix
```

Each `MVMP_WORLDS` entry uses:

```text
world-id:discord-channel-id:display-name:description
```

You can still define known worlds up front, even if they share the same Discord channel:

```env
MVMP_WORLDS=world:DISCORD_CHANNEL_ID:Overworld:The main survival world,world_nether:DISCORD_CHANNEL_ID:Nether:The hot place
```

If the worker sees a new prefix that is not configured, it creates an auto-discovered world entry.

When `start-discord-worker.bat` runs, it:

- reads each configured Discord channel;
- stores messages in persistent local history;
- detects `[world]` prefixes from Minecraft bridge messages;
- detects join and leave messages from the Minecraft bridge;
- keeps last-known player online/offline state;
- exports `/data/worlds.json`, `/data/feeds/<world-id>.json`, and `/data/status/<world-id>.json` for the web app.

World pages are available at:

```text
/worlds/<world-id>
```

For example:

```text
/worlds/main
/worlds/creative
```

## MVMP Minecraft Commands

The MVMP bridge plugin adds a small set of operator commands:

```text
/mvmp createworld <name>
/mvmp tpall <world>
```

`/mvmp createworld adventure` creates:

```text
adventure_normal
adventure_nether
adventure_end
```

Nether and End portals are routed within the same world set. For example, a Nether portal in
`adventure_normal` sends players to `adventure_nether`, and returning sends them back to
`adventure_normal`.

`/mvmp tpall adventure_normal` teleports every online player to that world's spawn.

The bridge also sends completed advancements to Discord, excluding recipe unlock spam.

## Web Deployment

The web app is deployed with GitHub Actions and GitHub Pages.

First-time setup in each repository:

1. Push this repository to GitHub.
2. Open repository settings.
3. Go to `Pages`.
4. Set `Build and deployment` source to `GitHub Actions`.
5. Push to `main`, or run `Deploy web to GitHub Pages` manually from the Actions tab.

The workflow automatically builds `apps/discord-web` and publishes the generated static files.

Forks can publish to their own GitHub Pages site. For a normal project repository, the URL will usually be:

```text
https://<github-user>.github.io/<repo-name>/
```

If the repository itself is named `<github-user>.github.io`, the site is published at:

```text
https://<github-user>.github.io/
```

The workflow sets the Vite base path from the current repository name, so forks do not need to edit code just to deploy their own copy.
