// Configuration interface for dashboard flexibility
export interface DashboardConfig {
  matchesPerPage: number;
  sessionsPerPage: number;
  showChart: boolean;
  showSessionStats: boolean;
  showUserInfo: boolean;
  theme: 'dark' | 'light';
}

// Default configuration
export const defaultConfig: DashboardConfig = {
  matchesPerPage: 8,
  sessionsPerPage: 3,
  showChart: true,
  showSessionStats: false,
  showUserInfo: true,
  theme: 'dark'
};

// Configuration builder for custom setups
export class DashboardConfigBuilder {
  private config: DashboardConfig;

  constructor() {
    this.config = { ...defaultConfig };
  }

  setMatchesPerPage(count: number): DashboardConfigBuilder {
    this.config.matchesPerPage = count;
    return this;
  }

  setSessionsPerPage(count: number): DashboardConfigBuilder {
    this.config.sessionsPerPage = count;
    return this;
  }

  setTheme(theme: 'dark' | 'light'): DashboardConfigBuilder {
    this.config.theme = theme;
    return this;
  }

  showChart(show: boolean): DashboardConfigBuilder {
    this.config.showChart = show;
    return this;
  }

  showSessionStats(show: boolean): DashboardConfigBuilder {
    this.config.showSessionStats = show;
    return this;
  }

  showUserInfo(show: boolean): DashboardConfigBuilder {
    this.config.showUserInfo = show;
    return this;
  }

  build(): DashboardConfig {
    return { ...this.config };
  }
}