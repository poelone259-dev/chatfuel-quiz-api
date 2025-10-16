// functions/check-cooldown.js

const moment = require('moment');

// Helper function to format seconds into readable time (e.g., 1 hour 30 minutes)
function formatTime(seconds) {
  const duration = moment.duration(seconds, 'seconds');
  const hours = duration.hours();
  const minutes = duration.minutes();
  
  let output = "";
  if (hours > 0) {
    output += `${hours} hours `;
  }
  if (minutes > 0) {
    output += `${minutes} minutes`;
  }
  
  if (output === "") {
      return "seconds";
  }

  return output.trim();
}

// Netlify Function Handler - Chatfuel က GET request ပို့တာကို လက်ခံမည်။
exports.handler = async (event, context) => {
  
  // Chatfuel က ပို့လိုက်တဲ့ Parameters တွေကို event.queryStringParameters ကနေ ယူရမည်။
  const { last_time, cooldown } = event.queryStringParameters;
  
  if (!last_time || !cooldown) {
    // ဤနေရာတွင် Log တစ်ခုခု ထုတ်ပြီး Chatfuel ကို JSON Error ပြန်ပို့သင့်သည်။
    console.error("Missing required parameters!");
    return { statusCode: 400, body: JSON.stringify({ error: "Missing parameters from Chatfuel." }) };
  }
  
  const lastPlayedTimeString = last_time; 
  const cooldownSeconds = parseInt(cooldown || '3600', 10); 

  // Data မပါရင် Error ပြန်ပေးမည်။
  if (!lastPlayedTimeString) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing last_time parameter." })
    };
  }
  
  // 1. Times တွေကို Unix Timestamp (စက္ကန့်) အဖြစ် ပြောင်းလဲခြင်း
  const format = "DD/MM/YYYY hh:mm:ss";
  const lastPlayedTime = moment(lastPlayedTimeString, format).unix(); 
  const currentTime = moment().unix(); 

  // 2. စောင့်ဆိုင်းရမယ့်အချိန် ကျော်မကျော် တွက်ချက်ခြင်း
  const timeSinceLastPlay = currentTime - lastPlayedTime;
  const timeLeft = cooldownSeconds - timeSinceLastPlay;

  let responseData = {};

  if (timeLeft <= 0) {
    // ဖြေဆိုခွင့်ရပြီ။
    responseData = {
      set_attributes: {
        "can_play": "Yes",
        "time_left_display": "0" 
      }
    };
  } else {
    // စောင့်ဆိုင်းရဦးမည်။
    responseData = {
      set_attributes: {
        "can_play": "No",
        "time_left_display": formatTime(timeLeft) 
      }
    };
  }

  // Netlify Function သည် JSON object ကို Return ပေးရမည်။
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(responseData)
  };

};

