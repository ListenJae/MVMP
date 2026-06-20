package com.listenjae.mvmp.discordbridge;

import io.papermc.paper.event.player.AsyncChatEvent;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import net.kyori.adventure.text.serializer.plain.PlainTextComponentSerializer;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.PlayerDeathEvent;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.plugin.java.JavaPlugin;

public final class MVMPDiscordBridgePlugin extends JavaPlugin implements Listener {
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

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
            "player", event.getPlayer().getName()
        ));
    }

    @EventHandler
    public void onPlayerQuit(PlayerQuitEvent event) {
        sendConfiguredMessage("messages.player-quit", Map.of(
            "player", event.getPlayer().getName()
        ));
    }

    @EventHandler
    public void onPlayerDeath(PlayerDeathEvent event) {
        String deathMessage = event.deathMessage() == null
            ? event.getEntity().getName() + " died."
            : PlainTextComponentSerializer.plainText().serialize(event.deathMessage());
        sendConfiguredMessage("messages.player-death", Map.of(
            "message", deathMessage
        ));
    }

    @EventHandler
    public void onAsyncChat(AsyncChatEvent event) {
        String message = PlainTextComponentSerializer.plainText().serialize(event.message());
        sendConfiguredMessage("messages.chat", Map.of(
            "player", event.getPlayer().getName(),
            "message", message
        ));
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
}
