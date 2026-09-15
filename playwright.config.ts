import { defineConfig } from "@playwright/test";
export default defineConfig({
    testDir: "./tests",
    workers: 1,
    timeout: 45000,
    use: {
        baseURL: "http://127.0.0.1:4173",
        launchOptions: {
            executablePath: process.env.CHROME_PATH,
            args: [
                "--no-sandbox",
                "--use-angle=swiftshader",
                "--enable-unsafe-swiftshader",
            ],
        },
    },
    webServer: {
        command: "npm run preview -- --port 4173",
        url: "http://127.0.0.1:4173",
        reuseExistingServer: !process.env.CI,
    },
});
