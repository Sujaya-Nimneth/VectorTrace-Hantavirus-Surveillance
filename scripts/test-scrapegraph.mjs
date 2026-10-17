const API_KEY = process.env.SCRAPEGRAPH_API_KEY || "";

if (!API_KEY) {
  console.error("Missing SCRAPEGRAPH_API_KEY in environment.");
  process.exit(1);
}

const body = {
  website_url: "https://www.who.int/emergencies/disease-outbreak-news",
  user_prompt:
    "Return a JSON array of the latest 3 Disease Outbreak News items with title and date.",
};

const res = await fetch("https://api.scrapegraphai.com/v1/smartscraper", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
  body: JSON.stringify(body),
});

const text = await res.text();
console.log(`status: ${res.status}`);
console.log(text.slice(0, 2000));
