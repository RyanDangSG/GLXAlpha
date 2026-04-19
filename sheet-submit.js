export async function submitToSheet({ name, phone, email }) {
  const scriptURL = "https://script.google.com/macros/s/AKfycbwUYFf_z1YVebSJ-4ao57_OTLEuLerqFnQsaRVTFKjqv6enPYRdykZdz8DHxlbCLNfK/exec";

  const payload = {
    name: name || "",
    phone: phone || "",
    email: email || ""
  };

  const response = await fetch(scriptURL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("Sheet response parse error:", error, text);
    return {
      success: false,
      error: "Google Sheet trả về dữ liệu không hợp lệ."
    };
  }
}
