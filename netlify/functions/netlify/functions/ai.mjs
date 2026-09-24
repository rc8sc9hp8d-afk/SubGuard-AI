export default async (request) => {
  try {
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "Method not allowed"
        }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const body = await request.json();

    const message = body.message || "";
    const subscriptions = body.subscriptions || [];
    const expenses = body.expenses || [];

    if (!message) {
      return new Response(
        JSON.stringify({
          error: "Message is required"
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "GEMINI_API_KEY is not configured"
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const prompt = `
คุณคือ SubGuard AI
ผู้ช่วยด้านการจัดการ Subscription และค่าใช้จ่ายส่วนบุคคล

ข้อมูล Subscription:
${JSON.stringify(subscriptions, null, 2)}

ข้อมูลค่าใช้จ่าย:
${JSON.stringify(expenses, null, 2)}

คำถามของผู้ใช้:
${message}

ให้ตอบเป็นภาษาไทย
ตอบแบบเข้าใจง่าย กระชับ และนำไปใช้ได้จริง
ห้ามแต่งข้อมูลที่ไม่มีอยู่ในข้อมูลของผู้ใช้
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
        encodeURIComponent(apiKey),
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error:
            data?.error?.message ||
            "Gemini API request failed"
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "AI ไม่สามารถสร้างคำตอบได้";

    return new Response(
      JSON.stringify({
        reply
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  } catch (error) {

    return new Response(
      JSON.stringify({
        error:
          error?.message ||
          "Internal server error"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  }
};
