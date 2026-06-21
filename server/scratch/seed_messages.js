import prisma from "../config/prisma.js";

async function main() {
  console.log("🧹 Clearing existing direct messages...");
  await prisma.message.deleteMany({});

  const suvin19Id = "1e6f028d-f150-4a31-b222-acbd33d10d36"; // suvintm19@gmail.com
  const suvin1515Id = "d4297d72-49fe-4f3e-a1f5-11b5d6d00200"; // suvintm1515@gmail.com
  
  const creators = {
    naveen: "dfef7ccd-a9d9-413a-90d6-2700515bcb81",   // Tech in Kannada
    sneha: "48e43f2a-74b0-4b13-bf8f-cb4246c039ea",    // Sneha Gowda
    rakshith: "6bed7ea7-78cb-4d50-b337-39b5cefdc808", // Rakshith Shetty
  };

  const editors = {
    arjun: "b5350cde-b1cc-4386-a2ff-db31b869f3ab",    // Arjun Mehta
    priya: "98d4aac3-87b5-4eda-ae6d-eb2304918e33",    // Priya Sharma
    rohan: "b12db1c4-7b36-4ca2-8289-264e559f5ab1",    // Rohan Verma
  };

  const now = new Date();
  
  const getPastTime = (minutesAgo) => {
    const d = new Date(now);
    d.setMinutes(d.getMinutes() - minutesAgo);
    return d;
  };

  console.log("🌱 Seeding direct messages...");

  const msgData = [
    // 1. Suvin T M <-> EditorKarthi (Primary Chat)
    { sender_id: suvin19Id, receiver_id: suvin1515Id, content: "Hey Karthi! Are you available to edit my upcoming YouTube video?", created_at: getPastTime(60) },
    { sender_id: suvin1515Id, receiver_id: suvin19Id, content: "Hey Suvin! Yes, I am free this week. What kind of edit do you need?", created_at: getPastTime(55) },
    { sender_id: suvin19Id, receiver_id: suvin1515Id, content: "It's a tech review vlog, about 15 minutes long. I want lots of dynamic graphics and clean B-roll transitions.", created_at: getPastTime(50) },
    { sender_id: suvin1515Id, receiver_id: suvin19Id, content: "Sounds great! Do you have the raw footage uploaded to Cloudinary?", created_at: getPastTime(45) },
    { sender_id: suvin19Id, receiver_id: suvin1515Id, content: "Yes, I'll share the folder link right away. What's your estimated timeline for the first draft?", created_at: getPastTime(40) },
    { sender_id: suvin1515Id, receiver_id: suvin19Id, content: "I can deliver the first draft by Tuesday afternoon. Let me know if that works.", created_at: getPastTime(35) },
    { sender_id: suvin19Id, receiver_id: suvin1515Id, content: "Tuesday works perfectly. Let's lock this in. Let's discuss the contract rate in our workspace.", created_at: getPastTime(30) },
    { sender_id: suvin1515Id, receiver_id: suvin19Id, content: "Sounds good! I'll create a proposal on Suvix right now.", created_at: getPastTime(25) },
    { sender_id: suvin19Id, receiver_id: suvin1515Id, content: "Perfect, looking forward to it!", created_at: getPastTime(20) },

    // 2. Suvin T M <-> Naveen Kumar (Creator to Creator/Collaborator)
    { sender_id: creators.naveen, receiver_id: suvin19Id, content: "Hey Suvin, did you check the analytics on our collaboration video?", created_at: getPastTime(120) },
    { sender_id: suvin19Id, receiver_id: creators.naveen, content: "Hey Naveen! Yes, it's performing exceptionally well. 50k views in 24 hours!", created_at: getPastTime(115) },
    { sender_id: creators.naveen, receiver_id: suvin19Id, content: "That's awesome! The audience loved the edit. Let's plan another shoot next month.", created_at: getPastTime(110) },
    { sender_id: suvin19Id, receiver_id: creators.naveen, content: "Absolutely. I have some fresh ideas about smart home tech reviews.", created_at: getPastTime(105) },
    { sender_id: creators.naveen, receiver_id: suvin19Id, content: "Perfect, let's connect on Zoom this Friday to outline the script.", created_at: getPastTime(100) },

    // 3. Suvin T M <-> Arjun Mehta (Creator to Editor)
    { sender_id: suvin19Id, receiver_id: editors.arjun, content: "Hey Arjun, do you have experience editing Kannada travel vlogs?", created_at: getPastTime(180) },
    { sender_id: editors.arjun, receiver_id: suvin19Id, content: "Hey Suvin, yes! I have worked on 4 travel vlogs before. I specialize in sound design and color grading.", created_at: getPastTime(175) },
    { sender_id: suvin19Id, receiver_id: editors.arjun, content: "Excellent. I'm looking for a long-term editor. I'll send you a short sample to test.", created_at: getPastTime(170) },
    { sender_id: editors.arjun, receiver_id: suvin19Id, content: "Awesome, send it over. I'll get back to you with the draft in 24 hours.", created_at: getPastTime(165) },

    // 4. EditorKarthi <-> Sneha Gowda (Editor to Creator)
    { sender_id: creators.sneha, receiver_id: suvin1515Id, content: "Hi Karthi, I need an editor for my cooking channel. Do you edit food vlogs?", created_at: getPastTime(150) },
    { sender_id: suvin1515Id, receiver_id: creators.sneha, content: "Hello Sneha! Yes, I do. Food vlogs require very appetizing color correction and relaxing background beats. I can definitely help.", created_at: getPastTime(145) },
    { sender_id: creators.sneha, receiver_id: suvin1515Id, content: "Great! Can we discuss your rates per video?", created_at: getPastTime(140) },
    { sender_id: suvin1515Id, receiver_id: creators.sneha, content: "Sure, my standard rate is ₹4,000 per 10-minute video. That includes 2 revisions.", created_at: getPastTime(135) },

    // 5. EditorKarthi <-> Priya Sharma (Editor to Editor collaboration)
    { sender_id: editors.priya, receiver_id: suvin1515Id, content: "Hey Karthi, are you attending the editors meetup in Bangalore this weekend?", created_at: getPastTime(200) },
    { sender_id: suvin1515Id, receiver_id: editors.priya, content: "Hey Priya! Yes, I am planning to. Let's meet up there and discuss our current workflows.", created_at: getPastTime(195) },
    { sender_id: editors.priya, receiver_id: suvin1515Id, content: "Awesome, let's catch up at the venue around 3 PM.", created_at: getPastTime(190) },
  ];

  for (const msg of msgData) {
    await prisma.message.create({
      data: {
        sender_id: msg.sender_id,
        receiver_id: msg.receiver_id,
        content: msg.content,
        type: "text",
        created_at: msg.created_at,
        is_read: false
      }
    });
  }

  console.log("✅ Messages seeded successfully!");
}

main().catch(console.error);
