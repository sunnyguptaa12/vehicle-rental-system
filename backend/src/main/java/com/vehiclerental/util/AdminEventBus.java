package com.vehiclerental.util;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.LinkedBlockingQueue;

public final class AdminEventBus {
    private static final CopyOnWriteArraySet<BlockingQueue<String>> SUBSCRIBERS = new CopyOnWriteArraySet<>();

    private AdminEventBus() {}

    public static BlockingQueue<String> subscribe() {
        BlockingQueue<String> queue = new LinkedBlockingQueue<>(16);
        SUBSCRIBERS.add(queue);
        queue.offer("{}");
        return queue;
    }

    public static void unsubscribe(BlockingQueue<String> queue) {
        SUBSCRIBERS.remove(queue);
    }

    public static void publishDashboardUpdate() {
        for (BlockingQueue<String> queue : SUBSCRIBERS) {
            if (!queue.offer("{}")) {
                queue.poll();
                queue.offer("{}");
            }
        }
    }
}
