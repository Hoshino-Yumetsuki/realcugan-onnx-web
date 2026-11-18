# /// script
# dependencies = ["playwright==1.65.2"]
# ///
import sys

from playwright.sync_api import expect, sync_playwright


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome")
    page = browser.new_page(**playwright.devices["iPhone 12"])
    page.goto(sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5173/")

    def check_article(language):
        article = page.get_by_role("article")
        expect(article).to_have_count(1)
        expect(article).to_have_attribute("lang", language)

    page.locator(".floating-preferences button").first.tap()
    page.get_by_role("menuitem", name="English").tap()
    check_article("en")

    settings = page.get_by_role("button", name="Parameter settings")
    page.mouse.wheel(0, 3000)
    page.wait_for_function("scrollY > 0 && scrollY + innerHeight >= document.documentElement.scrollHeight - 1")
    settings.tap()
    page.get_by_role("button", name="Sample", exact=True).tap()
    expect(settings).to_be_focused()
    page.mouse.wheel(0, -3000)
    page.wait_for_function("scrollY === 0")

    page.get_by_role("link", name="日本語").tap()
    check_article("ja")
    page.get_by_role("link", name="中文").tap()
    check_article("zh-CN")
    browser.close()
