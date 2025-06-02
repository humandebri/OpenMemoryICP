# MCP Setup Documentation

## Playwright MCP Server Configuration

### Overview
This project uses the Microsoft Playwright MCP (Model Context Protocol) server to enable AI-assisted browser automation and testing capabilities.

### Configuration Details
- **Server Name**: `playwright`
- **Scope**: Local (project-specific)
- **Transport**: stdio
- **Command**: `npx @playwright/mcp@latest`
- **Repository**: https://github.com/microsoft/playwright-mcp

### Installation Steps Completed
1. ✅ Installed Playwright MCP package: `npm install @playwright/mcp`
2. ✅ Added MCP server configuration: `claude mcp add playwright --scope local -- npx @playwright/mcp@latest`
3. ✅ Installed browser binaries: `npx playwright install`
4. ✅ Verified configuration: `claude mcp list` and `claude mcp get playwright`

### Available Capabilities
- **Browser Automation**: Control Chromium, Firefox, and WebKit browsers
- **Accessibility Snapshots**: Fast, lightweight accessibility tree analysis
- **Web Interactions**: Click, type, navigate, and interact with web elements
- **Vision Mode**: Optional screenshot-based interactions
- **LLM Integration**: Provides structured, AI-friendly web page data

### Usage Examples
The MCP server can be used for:
- Automated testing of the OpenMemory UI
- Web scraping and data extraction
- User interface validation
- Cross-browser compatibility testing
- Accessibility auditing

### Management Commands
```bash
# List all configured MCP servers
claude mcp list

# Get details for Playwright server
claude mcp get playwright

# Remove server (if needed)
claude mcp remove playwright -s local
```

### Security Notes
- Using official Microsoft Playwright MCP server
- Configured with local scope for project isolation
- Trusted for development and testing use

### Next Steps
1. The MCP server is ready for use in Claude Code sessions
2. Can be utilized for automated testing of OpenMemory features
3. Supports both headless and headed browser modes
4. Integrates seamlessly with existing Playwright test configuration

---
*Last updated: $(date)*