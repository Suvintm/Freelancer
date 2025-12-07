import fs from "fs";

const run = async () => {
    try {
        const res = await fetch("http://localhost:5000/api/profile/69346be8bf771102a6f36390");
        console.log("Status:", res.status);
        const data = await res.json();
        fs.writeFileSync("api_response.json", JSON.stringify(data, null, 2));
        console.log("Response written to api_response.json");
    } catch (error) {
        console.error("Error:", error.message);
    }
};

run();
