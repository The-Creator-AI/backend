import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

interface BrowserTab {
  page: puppeteer.Page;
  isBusy: boolean;
}

@Injectable()
export class BrowserService {
  private browser: puppeteer.Browser | undefined;
  private tabs: BrowserTab[] = [];

  async destructor() {
    await this.closeAllTabs();
    await this.close();
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--disable-features=site-per-process'],
    });
  }

  async getTab(): Promise<puppeteer.Page> {
    const availableTab = this.tabs.find((tab) => !tab.isBusy);
    if (availableTab) {
      availableTab.isBusy = true;
      return availableTab.page;
    } else {
      const newTab = await this.createNewTab();
      newTab.isBusy = true;
      return newTab.page;
    }
  }

  async releaseTab(page: puppeteer.Page) {
    const tab = this.tabs.find((t) => t.page === page);
    if (tab) {
      tab.isBusy = false;
    }
  }

  private async createNewTab(): Promise<BrowserTab> {
    const page = await this.browser!.newPage();
    const newTab: BrowserTab = {
      page,
      isBusy: false,
    };
    this.tabs.push(newTab);
    return newTab;
  }

  async closeAllTabs() {
    for (const tab of this.tabs) {
      await tab.page.close();
    }
    this.tabs = [];
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
    }
  }
}
