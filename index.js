require("./app");

const cheerio = require("cheerio");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { CronJob } = require("cron");

const updateJob = new CronJob(
  "0 0 1 * *",
  function () {
    update();
  },
  null,
  true,
  "America/Los_Angeles"
);

update();
updateJob.start();

function update() {
  axios
    .get("https://scoutwiki.scouts.org.za/?title=Scout_Interest_Badges")
    .then(async (res) => {
      const $ = cheerio.load(res.data);

      const scoutcraftBadges = [];
      const interestBadges = [];

      const ibRaw = $(".columns-list.medium-colsize.full-width")[1]
        .children.find((c) => c.type === "tag" && c.name === "ul")
        .children.filter((c) => c.type === "tag" && c.name === "li")
        .map((i) => i.children[0]);

      for (let i = 0; i < ibRaw.length; i++) {
        const badge = ibRaw[i];
        const link = `https://scoutwiki.scouts.org.za${badge.attribs.href}`;

        const res = await axios.get(link);
        const ib$ = cheerio.load(res.data);

        const floatRight = ib$(".floatright")[0];
        const img = floatRight
          ? floatRight.children.find(
              (c) => c.type === "tag" && c.name === "img"
            )
          : null;

        const list = ib$(".mw-parser-output")[1].children.find(
          (c) => c.type === "tag" && c.name === "ol"
        );
        if (!list) {
          console.log(`No ol tag found at ${link}`);
          continue;
        }

        const requirements = list.children
          .filter((c) => c.type === "tag" && c.name === "li")
          .map((c) => c.children)
          .map((row, i) => {
            const arr = row.map((child) =>
              child.type === "tag" && child.name === "a"
                ? `[${child.attribs.title}](https://scoutwiki.scouts.org.za${child.attribs.href})`
                : child.data
            );
            arr.unshift(`${i + 1}. `);
            const str = arr
              .map((part) => (part ? part.trim() : part))
              .join(" ")
              .replace(/\n/gi, "");
            return str;
          });

        const info = {
          name: badge.attribs.title,
          link,
          requirements,
        };
        if (img) info.img = `https://scoutwiki.scouts.org.za${img.attribs.src}`;
        interestBadges.push(info);

        console.log(`Loaded ${badge.attribs.title} (${i + 1}/${ibRaw.length})`);
      }

      const scRaw = $(".columns-list.medium-colsize.full-width")[0]
        .children.find((c) => c.type === "tag" && c.name === "ul")
        .children.filter((c) => c.type === "tag" && c.name === "li")
        .map((i) => i.children[0]);

      for (let i = 0; i < scRaw.length; i++) {
        const badge = scRaw[i];
        const link = `https://scoutwiki.scouts.org.za${badge.attribs.href}`;

        const scRes = await axios.get(link);
        const sc$ = cheerio.load(scRes.data);

        const list = sc$(".mw-parser-output")[1].children.find(
          (c) => c.type === "tag" && c.name === "ol"
        );
        if (!list) {
          console.log(`No ol tag found at ${link}`);
          continue;
        }

        const floatRight = sc$(".floatright")[0];
        const img = floatRight
          ? floatRight.children.find(
              (c) => c.type === "tag" && c.name === "img"
            )
          : null;

        const requirements = list.children
          .filter((c) => c.type === "tag" && c.name === "li")
          .map((c) => c.children)
          .map((row, i) => {
            const arr = row.map((child) =>
              child.type === "tag" && child.name === "a"
                ? `[${child.attribs.title}](https://scoutwiki.scouts.org.za${child.attribs.href})`
                : child.data
            );
            arr.unshift(`${i + 1}. `);
            const str = arr
              .map((part) => (part ? part.trim() : part))
              .join(" ")
              .replace(/\n/gi, "");
            return str;
          });

        const info = {
          name: badge.attribs.title,
          link,
          requirements,
        };
        if (img) info.img = `https://scoutwiki.scouts.org.za${img.attribs.src}`;
        scoutcraftBadges.push(info);

        console.log(`Loaded ${badge.attribs.title} (${i + 1}/${scRaw.length})`);
      }

      const scPath = path.join(__dirname, "badges", "sc.json");
      fs.writeFile(scPath, JSON.stringify({ data: scoutcraftBadges }), (err) =>
        err ? console.error(err) : delete require.cache[scPath]
      );

      const ibPath = path.join(__dirname, "badges", "ib.json");
      fs.writeFile(ibPath, JSON.stringify({ data: interestBadges }), (err) =>
        err ? console.error(err) : delete require.cache[ibPath]
      );

      console.log("Fully loaded");
    });
}
