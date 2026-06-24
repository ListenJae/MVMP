package com.listenjae.mvmp.discordbridge;

import io.papermc.paper.event.player.AsyncChatEvent;
import java.io.IOException;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import net.kyori.adventure.text.serializer.plain.PlainTextComponentSerializer;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.World;
import org.bukkit.WorldCreator;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.PlayerDeathEvent;
import org.bukkit.event.player.PlayerAdvancementDoneEvent;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerPortalEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.event.player.PlayerTeleportEvent.TeleportCause;
import org.bukkit.plugin.java.JavaPlugin;
import org.jetbrains.annotations.NotNull;

public final class MVMPDiscordBridgePlugin extends JavaPlugin implements Listener {
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    private static final List<String> WORLD_SUFFIXES = List.of("_normal", "_nether", "_end");

    private final OkHttpClient httpClient = new OkHttpClient();
    private ExecutorService executor;
    private String webhookUrl;
    private String username;

    @Override
    public void onEnable() {
        saveDefaultConfig();
        reloadBridgeConfig();

        executor = Executors.newSingleThreadExecutor(task -> {
            Thread thread = new Thread(task, "mvmp-discord-bridge");
            thread.setDaemon(true);
            return thread;
        });

        getServer().getPluginManager().registerEvents(this, this);
        sendConfiguredMessage("messages.server-started", Map.of());
    }

    @Override
    public void onDisable() {
        sendConfiguredMessage("messages.server-stopped", Map.of());
        if (executor != null) {
            executor.shutdown();
        }
    }

    @EventHandler
    public void onPlayerJoin(PlayerJoinEvent event) {
        sendConfiguredMessage("messages.player-join", Map.of(
            "player", event.getPlayer().getName(),
            "world", event.getPlayer().getWorld().getName()
        ));
    }

    @EventHandler
    public void onPlayerQuit(PlayerQuitEvent event) {
        sendConfiguredMessage("messages.player-quit", Map.of(
            "player", event.getPlayer().getName(),
            "world", event.getPlayer().getWorld().getName()
        ));
    }

    @EventHandler
    public void onPlayerDeath(PlayerDeathEvent event) {
        String deathMessage = event.deathMessage() == null
            ? event.getEntity().getName() + " died."
            : PlainTextComponentSerializer.plainText().serialize(event.deathMessage());
        sendConfiguredMessage("messages.player-death", Map.of(
            "message", deathMessage,
            "world", event.getEntity().getWorld().getName()
        ));
    }

    @EventHandler
    public void onAdvancementDone(PlayerAdvancementDoneEvent event) {
        String key = event.getAdvancement().getKey().getKey();
        if (key.startsWith("recipes/")) {
            return;
        }

        sendConfiguredMessage("messages.advancement", Map.of(
            "player", event.getPlayer().getName(),
            "world", event.getPlayer().getWorld().getName(),
            "advancement", key.replace('/', ' ')
        ));
    }

    @EventHandler
    public void onAsyncChat(AsyncChatEvent event) {
        String message = PlainTextComponentSerializer.plainText().serialize(event.message());
        sendConfiguredMessage("messages.chat", Map.of(
            "player", event.getPlayer().getName(),
            "message", message,
            "world", event.getPlayer().getWorld().getName()
        ));
    }

    @EventHandler
    public void onPlayerPortal(PlayerPortalEvent event) {
        WorldSet worldSet = WorldSet.fromWorld(event.getFrom().getWorld());
        if (worldSet == null) {
            return;
        }

        TeleportCause cause = event.getCause();
        if (cause == TeleportCause.NETHER_PORTAL) {
            handleNetherPortal(event, worldSet);
        } else if (cause == TeleportCause.END_PORTAL) {
            handleEndPortal(event, worldSet);
        }
    }

    @Override
    public boolean onCommand(
        @NotNull CommandSender sender,
        @NotNull Command command,
        @NotNull String label,
        @NotNull String[] args
    ) {
        if (args.length == 0 || args[0].equalsIgnoreCase("help")) {
            sendHelp(sender);
            return true;
        }

        if (args[0].equalsIgnoreCase("createworld") || args[0].equalsIgnoreCase("create")) {
            if (args.length < 2) {
                sender.sendMessage("Usage: /mvmp createworld <name>");
                return true;
            }

            createWorldSet(sender, args[1]);
            return true;
        }

        if (args[0].equalsIgnoreCase("tpall")) {
            if (args.length < 2) {
                sender.sendMessage("Usage: /mvmp tpall <world>");
                return true;
            }

            teleportAll(sender, args[1]);
            return true;
        }

        sendHelp(sender);
        return true;
    }

    private void reloadBridgeConfig() {
        FileConfiguration config = getConfig();
        webhookUrl = config.getString("discord.webhook-url", "");
        username = config.getString("discord.username", "MVMP Server");

        String envWebhook = System.getenv("DISCORD_WEBHOOK_URL");
        if (envWebhook != null && !envWebhook.isBlank()) {
            webhookUrl = envWebhook;
        }
    }

    private void createWorldSet(CommandSender sender, String rawName) {
        String baseName = normalizeWorldBase(rawName);
        if (baseName.isBlank()) {
            sender.sendMessage("World name must contain letters, numbers, underscores, or dashes.");
            return;
        }

        World normal = createWorld(baseName + "_normal", World.Environment.NORMAL);
        World nether = createWorld(baseName + "_nether", World.Environment.NETHER);
        World end = createWorld(baseName + "_end", World.Environment.THE_END);

        sender.sendMessage("Created world set: " + normal.getName() + ", " + nether.getName() + ", " + end.getName());
        sender.sendMessage("Use /mvmp tpall " + normal.getName() + " to move everyone there.");
        sendToDiscord("[server] Created world set " + baseName + " (" + normal.getName() + ", " + nether.getName() + ", " + end.getName() + ").");
    }

    private World createWorld(String name, World.Environment environment) {
        World existing = Bukkit.getWorld(name);
        if (existing != null) {
            return existing;
        }

        return Bukkit.createWorld(new WorldCreator(name).environment(environment));
    }

    private void teleportAll(CommandSender sender, String worldName) {
        World world = Bukkit.getWorld(worldName);
        if (world == null) {
            sender.sendMessage("Unknown world: " + worldName);
            return;
        }

        Location destination = world.getSpawnLocation();
        int count = 0;
        for (Player player : Bukkit.getOnlinePlayers()) {
            player.teleport(destination);
            count++;
        }

        sender.sendMessage("Teleported " + count + " player(s) to " + world.getName() + ".");
        sendToDiscord("[" + world.getName() + "] Teleported " + count + " player(s) to " + world.getName() + ".");
    }

    private void handleNetherPortal(PlayerPortalEvent event, WorldSet worldSet) {
        World targetWorld;
        double scale;

        if (worldSet.dimension == WorldDimension.NORMAL) {
            targetWorld = Bukkit.getWorld(worldSet.baseName + "_nether");
            scale = 0.125;
        } else if (worldSet.dimension == WorldDimension.NETHER) {
            targetWorld = Bukkit.getWorld(worldSet.baseName + "_normal");
            scale = 8.0;
        } else {
            return;
        }

        if (targetWorld == null) {
            return;
        }

        Location from = event.getFrom();
        event.setTo(new Location(
            targetWorld,
            from.getX() * scale,
            targetWorld.getSpawnLocation().getY(),
            from.getZ() * scale,
            from.getYaw(),
            from.getPitch()
        ));
    }

    private void handleEndPortal(PlayerPortalEvent event, WorldSet worldSet) {
        World targetWorld;
        if (worldSet.dimension == WorldDimension.NORMAL) {
            targetWorld = Bukkit.getWorld(worldSet.baseName + "_end");
        } else if (worldSet.dimension == WorldDimension.END) {
            targetWorld = Bukkit.getWorld(worldSet.baseName + "_normal");
        } else {
            return;
        }

        if (targetWorld != null) {
            event.setTo(targetWorld.getSpawnLocation());
        }
    }

    private void sendHelp(CommandSender sender) {
        sender.sendMessage("MVMP commands:");
        sender.sendMessage("/mvmp createworld <name> - create <name>_normal, <name>_nether, <name>_end");
        sender.sendMessage("/mvmp tpall <world> - teleport every online player to a world spawn");
    }

    private String normalizeWorldBase(String value) {
        String normalized = value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_-]", "_");
        for (String suffix : WORLD_SUFFIXES) {
            if (normalized.endsWith(suffix)) {
                return normalized.substring(0, normalized.length() - suffix.length());
            }
        }

        return normalized;
    }

    private void sendConfiguredMessage(String path, Map<String, String> values) {
        String template = getConfig().getString(path, "");
        if (template == null || template.isBlank()) {
            return;
        }

        String content = template;
        for (Map.Entry<String, String> entry : values.entrySet()) {
            content = content.replace("%" + entry.getKey() + "%", entry.getValue());
        }

        sendToDiscord(content);
    }

    private void sendToDiscord(String content) {
        if (webhookUrl == null || webhookUrl.isBlank()) {
            getLogger().warning("Discord webhook URL is not configured.");
            return;
        }

        executor.submit(() -> {
            String payload = "{\"username\":\"" + escapeJson(username) + "\",\"content\":\"" + escapeJson(content) + "\"}";
            Request request = new Request.Builder()
                .url(webhookUrl)
                .post(RequestBody.create(payload, JSON))
                .build();

            try (var response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    getLogger().warning("Discord webhook failed with HTTP " + response.code());
                }
            } catch (IOException exception) {
                getLogger().warning("Discord webhook request failed: " + exception.getMessage());
            }
        });
    }

    private String escapeJson(String value) {
        return value
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r");
    }

    private enum WorldDimension {
        NORMAL,
        NETHER,
        END
    }

    private record WorldSet(String baseName, WorldDimension dimension) {
        private static WorldSet fromWorld(World world) {
            if (world == null) {
                return null;
            }

            String name = world.getName().toLowerCase(Locale.ROOT);
            if (name.endsWith("_normal")) {
                return new WorldSet(name.substring(0, name.length() - "_normal".length()), WorldDimension.NORMAL);
            }

            if (name.endsWith("_nether")) {
                return new WorldSet(name.substring(0, name.length() - "_nether".length()), WorldDimension.NETHER);
            }

            if (name.endsWith("_end")) {
                return new WorldSet(name.substring(0, name.length() - "_end".length()), WorldDimension.END);
            }

            return null;
        }
    }
}
