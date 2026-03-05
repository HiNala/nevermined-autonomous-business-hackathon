# Sponsor Tools Guide — Autonomous Business Hackathon
**March 5–6, 2026 | AWS Loft, San Francisco**

Your cheat sheet for every sponsor tool. For each one: what it actually does in plain English, how to start using it, what free credits you get, and quick code to get going.

---

## 1. AWS — Strands Agents SDK

**What it is in plain English:** Strands lets you build AI agents really fast. Instead of writing code to tell your agent exactly what to do step-by-step, you give it a job description (a prompt) and a toolbox (tools it can use). The AI figures out the rest. It's like hiring a smart intern — you say "research this topic" and they decide which websites to visit, which tools to use, and how to organize the results. AWS already uses Strands internally for Amazon Q Developer, so it's battle-tested.

**Why you care for this hackathon:** The hackathon repo has pre-built buyer and seller agents built with Strands. You can extend these or build your own. The default LLM is Claude on Amazon Bedrock.

**How to get it running:**

```bash
# Step 1: Install
pip install strands-agents strands-agents-tools   # Python
npm install @strands-agents/sdk                    # or TypeScript

# Step 2: Set up AWS credentials (needed for Bedrock)
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_DEFAULT_REGION="us-west-2"
# Also: enable Claude model access in the Bedrock console
```

**Build your first agent (Python — literally 3 lines):**

```python
from strands import Agent
from strands_tools import calculator

agent = Agent(tools=[calculator])
agent("What is the square root of 1764?")
```

**Connect to MCP tools (thousands of pre-built tools):**

```python
from strands import Agent
from strands.tools.mcp import MCPClient
from mcp import stdio_client, StdioServerParameters

client = MCPClient(
    lambda: stdio_client(StdioServerParameters(
        command="uvx",
        args=["awslabs.aws-documentation-mcp-server@latest"]
    ))
)
with client:
    agent = Agent(tools=client.list_tools_sync())
    agent("Tell me about Amazon Bedrock")
```

**Key things to know:**
- Multi-agent support: Graph, Swarm, and Workflow patterns for coordinating agent teams
- A2A protocol built-in: your Strands agents can talk to agents built with other frameworks
- Deploy anywhere: Lambda, Fargate, EKS, Bedrock AgentCore, Docker
- Built-in OpenTelemetry tracing for debugging

**Credits:** $25 in AWS credits — complete the survey at the event.

**Links:** [Docs](https://strandsagents.com/latest/documentation/docs/) · [GitHub](https://github.com/strands-agents/sdk-python) · [Samples](https://github.com/strands-agents/samples)

---

## 2. Apify — Web Scraping & Data Extraction

**What it is in plain English:** Apify is a giant library of 10,000+ pre-built web scrapers (called "Actors"). Need Google Maps data? There's an Actor. TikTok? Yep. The killer feature is the **Website Content Crawler** — takes any website and converts it into clean Markdown, stripping out all junk. Perfect for LLMs because Markdown uses 30-50% fewer tokens than raw HTML.

**Why you care:** Your agent needs data to sell. Apify is how you GET it. Build a seller agent that scrapes on demand and sells results via Nevermined.

```bash
pip install apify-client        # Python
npm install apify-client        # or JavaScript
```

**Scrape a website (Python):**

```python
from apify_client import ApifyClient

client = ApifyClient("YOUR_API_TOKEN")
run = client.actor("apify/website-content-crawler").call(run_input={
    "startUrls": [{"url": "https://docs.nevermined.app"}],
    "maxCrawlPages": 10
})
dataset = client.dataset(run["defaultDatasetId"])
for item in dataset.iterate_items():
    print(item['text'][:500])
```

**Credits:** $100 in Apify credits — claim via Discord.

**Links:** [Docs](https://docs.apify.com/) · [Actor Store](https://apify.com/store)

---

## 3. Exa — AI-Native Web Search

**What it is in plain English:** Exa is a search engine built for AI. Uses neural embeddings to understand what you MEAN, not just what you typed. Five endpoints: search, contents, findsimilar, answer, and research (automated multi-step research with structured JSON).

**Why you care:** If your agent needs web info to make decisions or sell as a service, Exa gives you the best quality results for AI use cases.

```bash
pip install exa-py       # Python
npm install exa-js       # JavaScript
```

**Search (Python):**

```python
from exa_py import Exa
exa = Exa("your-api-key")
results = exa.search("latest AI agent payment protocols",
    type="auto", contents={"highlights": {"maxCharacters": 4000}})
for r in results.results:
    print(f"{r.title}: {r.url}")
```

**Research API (structured output):**

```python
response = exa.research.create(
    instructions="Summarize recent advances in agent payments",
    output_schema={
        "type": "object",
        "properties": {
            "summary": {"type": "string"},
            "key_developments": {"type": "array", "items": {"type": "string"}}
        }
    }
)
```

**Credits:** $50 — claim via Discord.

**Links:** [Docs](https://docs.exa.ai/) · [MCP Server](https://github.com/exa-labs/exa-mcp-server)

---

## 4. Coinbase — x402 Payment Protocol

**What it is in plain English:** x402 is how machines pay each other over the internet. Your agent tries to access an API → the API says "that'll be $0.01 USDC" (HTTP 402 response) → your agent signs a payment and retries → payment settles on-chain → data returned. No accounts, no subscriptions — just pay-per-request. You don't need to implement x402 directly — Nevermined wraps it.

**Links:** [x402 Docs](https://docs.cdp.coinbase.com/x402/welcome) · [GitHub](https://github.com/coinbase/x402)

---

## 5. Mindra — Multi-Agent Orchestration

**What it is in plain English:** Mindra coordinates teams of AI agents. Route tasks to the right specialist, run them in parallel/sequential/DAG mode. Any language, any model.

**Prize:** $2,000 for 5+ agents in a single flow, or hierarchical orchestration (orchestrators of orchestrators) with Nevermined payments.

```bash
export MINDRA_API_KEY="mk_your_api_key"
curl -X POST https://api.mindra.co/v1/orchestrate \
    -H "Authorization: Bearer $MINDRA_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"query": "Research AI agent payments", "config": {"mode": "parallel"}}'
```

**Credits:** $25 — log in at [console.mindra.co](https://console.mindra.co).

**Links:** [Docs](https://docs.mindra.co/docs)

---

## 6. Ability — TrinityOS

**What it is in plain English:** Open-source platform for deploying AI agent teams on your own infrastructure. Docker containers per agent, persistent memory, human approval gates, audit trails.

**Prize:** $2,000 for best use of TrinityOS + Nevermined.

```bash
git clone https://github.com/Abilityai/trinity.git && cd trinity && docker compose up -d
```

**Links:** [Website](https://www.ability.ai/trinity) · [GitHub](https://github.com/Abilityai/trinity)

---

## 7. ZeroClick — AI-Native Ads

**What it is in plain English:** Put ads INSIDE your AI's responses — not annoying banners, but relevant brand context woven into the reasoning. Founded by the Honey co-founder ($4B exit). You earn money from impressions.

**Prize:** $2,000 for best ZeroClick + Nevermined integration.

**Links:** [Website](https://zeroclick.ai/)

---

## 8. Privy — Embedded Wallets

**What it is in plain English:** Creates crypto wallets for agents without anyone needing to know about crypto. Powers the USDC payment rail for this hackathon.

**Credits:** $50 USDC per attendee + 20 USDC welcome bonus (auto on Team Portal registration).

**Links:** [Docs](https://docs.privy.io/) · [x402 Recipe](https://privy.io/blog/building-agentic-and-programmatic-payments-with-x402-and-privy)

---

## 9. LangChain

Hackathon repo includes LangChain versions of buyer/seller agents alongside Strands versions.

**Links:** [Hackathon Repo](https://github.com/nevermined-io/hackathons)

---

## 10. HackerSquad — $50 in Codex API credits (Discord)

---

## Credits Summary

| Sponsor | Amount | How |
|---------|--------|-----|
| AWS | $25 | Event survey |
| Apify | $100 | Discord |
| Exa | $50 | Discord |
| HackerSquad | $50 | Discord |
| Mindra | $25 | console.mindra.co |
| Privy | $50 USDC + 20 USDC | Team Portal |
| **Total** | **$300+** | |
