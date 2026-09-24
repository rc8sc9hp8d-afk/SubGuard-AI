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

    const prompt = `
คุณคือ SubGuard AI ผู้ช่วยด้านการจัดการ Subscription และค่าใช้จ่ายส่วนบุคคล

ข้อมูล Subscription:
${JSON.stringify(subscriptions, null, 2)}

ข้อมูลค่าใช้จ่าย:
${JSON.stringify(expenses, null, 2)}

คำถามจากผู้ใช้:
${message}

กรุณาวิเคราะห์ข้อมูลและตอบเป็นภาษาไทย
ตอบแบบเข้าใจง่าย กระชับ และนำไปใช้ได้จริง
ถ้าเห็นว่าผู้ใช้มีค่าใช้จ่ายที่ควรระวัง ให้แนะนำอย่างสุภาพ
`;

    const apiKey = Netlify.env.get("GEMINI_API_KEY");

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

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
        apiKey,
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
          error: data.error?.message || "Gemini API request failed"
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const result =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "ไม่สามารถสร้างคำตอบได้ในขณะนี้";

    return new Response(
      JSON.stringify({
        success: true,
        result
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
        error: error.message || "Internal server error"
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
