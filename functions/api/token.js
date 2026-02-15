export async function onRequest(context) {
    if (context.request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        const formData = await context.request.formData();
        const secret = formData.get("secret");

        if (!secret) {
            return new Response("Missing secret", { status: 400 });
        }

        const tokenResponse = await fetch("https://www.opensymbols.org/api/v2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({ secret }),
        });

        const data = await tokenResponse.json();

        return new Response(JSON.stringify(data), {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
    }
}