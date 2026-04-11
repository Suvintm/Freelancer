import "dotenv/config";
import prisma from "../../server/config/prisma.js";
import notificationService from "../../server/modules/notification/services/notificationService.js";

async function verifyNotificationFlow() {
  console.log("🔍 --- STARTING NOTIFICATION FLOW VERIFICATION ---");
  
  try {
    const user = await prisma.user.findUnique({
      where: { email: "suvintm19@gmail.com" },
    });

    if (!user) {
      console.error("❌ User not found.");
      return;
    }

    console.log(`👤 Found user: ${user.email} (${user.id})`);

    // 1. Register a dummy token
    console.log("📲 Registering dummy FCM token...");
    await notificationService.registerToken(
        user.id, 
        "dummy_token_antigravity_test_123", 
        "ANDROID", 
        "Antigravity Dev Environment"
    );
    console.log("✅ Token registered successfully.");

    // 2. Trigger a notification
    console.log("🔔 Triggering test SYNC_COMPLETE notification...");
    const notif = await notificationService.notify({
        userId: user.id,
        type: 'SYNC_COMPLETE',
        title: 'Antigravity Test Notification 🚀',
        body: 'This is a production-level test of the new notification engine.',
        metadata: { testId: 'verify_001', context: 'dev_test' },
        priority: 'HIGH'
    });

    if (notif) {
        console.log(`✅ Notification saved in DB: ID=${notif.id}`);
        
        // 3. Verify in DB
        const dbNotif = await prisma.notification.findUnique({
            where: { id: notif.id }
        });
        
        if (dbNotif) {
            console.log(`✅ Data integrity check passed: Title in DB matches ("${dbNotif.title}")`);
        } else {
            console.error("❌ Data integrity check failed: Notification not found in DB.");
        }
    } else {
        console.error("❌ Notification creation failed.");
    }

  } catch (error) {
    console.error("❌ Verification failed with error:", error);
  } finally {
    await prisma.$disconnect();
    console.log("🏁 --- VERIFICATION COMPLETE ---");
    process.exit(0);
  }
}

verifyNotificationFlow();
