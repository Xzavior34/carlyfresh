/**
 * Standalone OneSignal v16 Diagnostic Test Script
 * Run this using: node test-onesignal-v16.js [target_external_id]
 */

// Configuration values from the codebase/trigger history
const ONESIGNAL_APP_ID = "e6446b40-1453-4ccd-929d-d8ccb8c7ff91";
const ONESIGNAL_REST_API_KEY = "os_v2_app_4zcgwqaukngm3eu53dglrr77sfjjfhhadhmub4ven7fwzqhqlu2bbgmieg5ffyxr3suuejmvvdq7arhkybjvxnqterggwxmiwbcl3la";

// Get user ID from command line arguments or default to a mock/known ID
const targetUserId = process.argv[2] || "70293517-8be7-42ed-9bf3-aad6bca93b17";

console.log("====================================================");
console.log("OneSignal v16 API Diagnostics");
console.log("====================================================");
console.log(`Targeting User (external_id): ${targetUserId}`);
console.log(`OneSignal App ID:              ${ONESIGNAL_APP_ID}`);
console.log(`OneSignal REST API Key:       ${ONESIGNAL_REST_API_KEY.slice(0, 15)}...`);
console.log("----------------------------------------------------\n");

async function sendDiagnosticNotification() {
  const url = "https://onesignal.com/api/v1/notifications";
  
  // Modern v16 payload structure
  const payload = {
    app_id: ONESIGNAL_APP_ID,
    target_channel: "push",
    include_aliases: {
      external_id: [targetUserId]
    },
    headings: {
      en: "Diagnostic Test"
    },
    contents: {
      en: "dYs? Test Notification! Your pipeline is working perfectly."
    }
  };

  console.log("Request Payload:");
  console.log(JSON.stringify(payload, null, 2));
  console.log("\nSending HTTP POST request to OneSignal...");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    
    console.log(`\nResponse Status Code: ${response.status}`);
    console.log("Response Headers:");
    console.log(Object.fromEntries(response.headers.entries()));

    console.log("\nResponse JSON Body:");
    try {
      const json = JSON.parse(responseText);
      console.log(JSON.stringify(json, null, 2));
    } catch {
      console.log(responseText);
    }
    
    if (response.status === 200) {
      console.log("\n🎉 Push notification request successfully accepted by OneSignal!");
    } else {
      console.log(`\n❌ OneSignal rejected request with status ${response.status}. See error details above.`);
    }

  } catch (error) {
    console.error("\n💥 Connection or execution error occurred:");
    console.error(error);
  }
}

sendDiagnosticNotification();
