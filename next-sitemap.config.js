const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://bulubulu.biz.id",
  generateRobotsTxt: true,
  changefreq: "weekly",
  priority: 0.7,
  exclude: ["/admin/*", "/gabung-mitra"],
  additionalPaths: async (config) => {
    // Initialize Firebase Admin
    const app = initializeApp(
      {
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
            /\\n/g,
            "\n"
          ),
        }),
      },
      "sitemap"
    );
    const db = getFirestore(app);

    const paths = [];

    // 1. All provider detail pages
    const providersSnap = await db
      .collection("providers")
      .select("category", "area_city")
      .get();

    const categoryCitySet = new Set();

    providersSnap.docs.forEach((doc) => {
      const data = doc.data();

      // Provider detail page
      paths.push({
        loc: `/providers/${doc.id}`,
        changefreq: "weekly",
        priority: 0.8,
      });

      // Collect category+city combos for SEO pages
      const cat = data.category;
      const city = data.area_city;
      if (cat && city) {
        categoryCitySet.add(`${cat}|${city}`);
      }
    });

    // 2. SEO directory pages: /jasa/[category]/[city]
    const categorySlugMap = {
      grooming: "grooming",
      vet: "dokter-hewan",
      hotel: "pet-hotel",
      petshop: "pet-shop",
      sitter: "pet-sitter",
    };

    for (const combo of categoryCitySet) {
      const [cat, city] = combo.split("|");
      const slug = categorySlugMap[cat];
      if (slug) {
        const citySlug = city.replace(/\s+/g, "-").toLowerCase();
        paths.push({
          loc: `/jasa/${slug}/${encodeURIComponent(citySlug)}`,
          changefreq: "weekly",
          priority: 0.9,
        });
      }
    }

    return paths;
  },
};
