const fs = require("fs");
const path = require("path");
const express = require("express");
const devalue = require("@nuxt/devalue");

const isTest = process.env.NODE_ENV === "test" || !!process.env.VITE_TEST_BUILD;

async function createServer(
  root = process.cwd(),
  isProd = process.env.NODE_ENV === "production"
) {
  const resolve = (p) => path.resolve(__dirname, p);

  const indexProd = isProd
    ? fs.readFileSync(resolve("dist/client/index.html"), "utf-8")
    : "";

  const manifest = isProd // @ts-ignore
    ? require("./dist/client/ssr-manifest.json")
    : {};

  const app = express();

  /**
   * @type {import('vite').ViteDevServer}
   */
  let vite;
  if (!isProd) {
    vite = await require("vite").createServer({
      root,
      logLevel: isTest ? "error" : "info",
      server: {
        middlewareMode: "ssr",
        watch: {
          // During tests we edit the files too fast and sometimes chokidar
          // misses change events, so enforce polling for consistency
          usePolling: true,
          interval: 100,
        },
      },
    });
    // use vite's connect instance as middleware
    app.use(vite.middlewares);
  } else {
    app.use(require("compression")());
    app.use(
      require("serve-static")(resolve("dist/client"), {
        index: false,
      })
    );
  }

  app.use("*", async (req, res) => {
    try {
      const url = req.originalUrl;

      let template, render;
      if (!isProd) {
        // always read fresh template in dev
        template = fs.readFileSync(resolve("index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        render = (await vite.ssrLoadModule("/src/entry-server.js")).render;
      } else {
        template = indexProd;
        render = require("./dist/server/entry-server.js").render;
      }

      const [appHtml, preloadLinks, context, headData] = await render(
        url,
        manifest
      );

      const { asyncData, piniaState } = context;

      const html = template
        .replace("{html-attrs}", headData.htmlAttrs)
        .replace("<!--head-tags-->", headData.headTags)
        .replace(`<!--preload-links-->`, preloadLinks)
        .replace(`<!--app-html-->`, appHtml)
        .replace(
          `<!--server-prefetch-data-->`,
          `<script>window.__ASYNC__DATA__ = ${devalue(asyncData)};</script>`
        )
        .replace(
          `<!--pinia-state-->`,
          `<script>window.__PINIA_STATE__ = ${devalue(piniaState)};</script>`
        );

      res
        .status(200)
        .set({
          "Content-Type": "text/html",
        })
        .end(html);
    } catch (e) {
      vite && vite.ssrFixStacktrace(e);
      console.log(e.stack);
      res.status(500).end(e.stack);
    }
  });

  return {
    app,
    vite,
  };
}

const port = process.env.PORT || 3001;

if (!isTest) {
  createServer().then(({ app }) =>
    app.listen(port, () => {
      console.log(`http://localhost:${port}`);
    })
  );
}

// for test use
exports.createServer = createServer;
