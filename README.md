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
- `start-discord-worker.bat`: syncs Discord channel messages into the web feed file.
- `start-web.bat`: starts the MVMP web page at `http://localhost:3000`.
- `build-plugin.bat`: builds and copies the Minecraft plugin jar.
- `update-dependencies.bat`: installs npm dependencies and verifies the web/plugin builds.

Before running Discord features, edit `.env` and fill in:

- `DISCORD_WEBHOOK_URL`
- `DISCORD_BOT_TOKEN`
- `DISCORD_CHANNEL_ID`

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
- The Discord worker writes a small public feed file for the web app. This keeps the first version simple while leaving room for a database-backed API later.

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
