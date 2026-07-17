/**
 * Learn Pi — progressive harness tutorial (Obsidian vault UI)
 * Structure inspired by shareAI-lab/learn-claude-code
 */
(() => {
	const $ = (sel, root = document) => root.querySelector(sel);
	const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

	const PROGRESS_KEY = "learn-pi-progress";
	const THEME_KEY = "learn-pi-theme";
	const SIDEBAR_WIDTH_KEY = "learn-pi-sidebar-width";
	const SIDEBAR_COLLAPSED_KEY = "learn-pi-sidebar-collapsed";

	/** Site base for GitHub project pages (meta[name=site-base], e.g. "/repo/"). */
	function siteBase() {
		const raw = document.querySelector('meta[name="site-base"]')?.getAttribute("content")?.trim() || "";
		if (!raw || raw === "/") return "";
		return raw.endsWith("/") ? raw.slice(0, -1) : raw;
	}

	/** Resolve asset path relative to site root (works on GH Pages root or subpath). */
	function assetUrl(path) {
		if (!path) return "";
		if (/^(https?:|data:|blob:)/i.test(path)) return path;
		const clean = path.replace(/^\.\//, "").replace(/^\//, "");
		const base = siteBase();
		return base ? `${base}/${clean}` : clean;
	}

	const isApple = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || "") ||
		(navigator.userAgentData?.platform === "macOS");
	const modKeyLabel = isApple ? "⌘" : "Ctrl";

	/**
	 * @typedef {{ src: string, alt: string, caption?: string, step?: number, width?: number, height?: number }} LessonFigure
	 * @typedef {{ id: string, sid: string, title: string, motto: string, explain: string, stage: number, concepts: string[], figures?: LessonFigure[], html: string }} Lesson
	 */

	/** @type {Lesson[]} */
	const LESSONS = [
		{
			id: "s01",
			sid: "s01",
			title: "Agent Loop",
			motto: "One loop is all you need",
			explain: "模型决定何时调工具、何时停；harness 只负责执行与回填结果。",
			stage: 1,
			concepts: ["messages[]", "while True", "tool_use", "tool_result"],
			// Image tutorials: add files under assets/lessons/sXX/ — see assets/lessons/README.md
			figures: [
				{
					src: "images/s01-agent-loop.png",
					alt: "Xiaohong demonstrates the agent loop from model decision to tool result and return",
					caption: "模型决定调用工具或返回文本；harness 执行工具并把结果写回循环。",
					step: 1,
					width: 1168,
					height: 784,
				},
			],
			html: `
<p class="lead">一切 Agent 产品的骨架都是同一个循环。Pi 的 <code>pi-agent-core</code> 把循环做在库里；你先理解它，再谈扩展。</p>
<div class="pattern"><span class="hi">User</span> → messages[] → <span class="hi">LLM</span> → response
                      │
            stop / tool_use?
           /              \\
         tool             text
          │                 │
    execute tools      return
    append results
    loop back ────────→ messages[]</div>
<h2>核心不变量</h2>
<ul class="feature-list">
<li><span class="mark">1</span><span>循环本身几乎不变——变的是 tools、context、permissions。</span></li>
<li><span class="mark">2</span><span>模型拥有 agency；代码不「编排智能」，只提供环境。</span></li>
<li><span class="mark">3</span><span>Pi 默认工具极少：<code>read / write / edit / bash</code>，与「One loop + tools」一致。</span></li>
</ul>
<div class="code-block">
<div class="code-block-header"><span>conceptual loop</span><button type="button" class="icon-btn copy-btn" data-copy="while (true) {&#10;  const response = await llm(messages, tools);&#10;  messages.push(response);&#10;  if (!response.hasToolCalls) break;&#10;  for (const call of response.toolCalls) {&#10;    const result = await runTool(call);&#10;    messages.push(result);&#10;  }&#10;}">Copy</button></div>
<pre><span class="comment">// 伪代码：循环归属 Agent；机制归属 Harness</span>
<span class="cmd">while</span> (true) {
  const response = <span class="cmd">await</span> llm(messages, tools);
  messages.push(response);
  <span class="cmd">if</span> (!response.hasToolCalls) <span class="cmd">break</span>;
  <span class="cmd">for</span> (const call of response.toolCalls) {
    const result = <span class="cmd">await</span> runTool(call);
    messages.push(result);
  }
}</pre>
</div>
<div class="callout"><div class="callout-icon">※</div><p>在 Pi 源码中对应 <code>packages/agent</code> 的 agent loop + 事件流；UI 层订阅事件，而不是另写一套「工作流引擎」。</p></div>
<details><summary>深潜：AgentMessage vs LLM Message</summary><div class="inner">
<p>Agent 层可以定义比 LLM 协议更丰富的消息类型。调用模型前，上下文会依次经过 <code>transformContext</code> 处理，并由 <code>convertToLlm</code> 转换为 provider 可接受的标准消息；仅供 UI 或会话管理使用的内容不会进入模型请求。这样，会话树、分支元数据等状态可以保留在 harness 中，而不必侵入 provider 的消息协议。</p>
</div></details>`,
		},
		{
			id: "s02",
			sid: "s02",
			title: "Tools",
			motto: "Adding a tool means adding one handler",
			explain: "循环不动；新能力注册进 dispatch map。",
			stage: 1,
			concepts: ["read", "write", "edit", "bash", "registerTool"],
			figures: [
				{
					src: "images/s02-tools.png",
					alt: "Xiaohong routes a tool call to read, write, edit, bash, or a registered extension tool",
					caption: "默认四工具共享同一分发入口；registerTool 可以继续增加新的 handler。",
					step: 1,
					width: 1168,
					height: 784,
				},
			],
			html: `
<p class="lead">Pi 默认只给模型四只手。其它能力（搜索、浏览器、权限门）用 extension 注册工具，而不是 fork 内核。</p>
<div class="grid-2">
<div class="card"><div class="card-title">read</div><p class="card-desc">读文件内容，建立感知。</p></div>
<div class="card"><div class="card-title">write</div><p class="card-desc">创建 / 覆盖文件。</p></div>
<div class="card"><div class="card-title">edit</div><p class="card-desc">精确补丁，少破坏上下文。</p></div>
<div class="card"><div class="card-title">bash</div><p class="card-desc">在项目环境执行命令（Windows 需 Git Bash）。</p></div>
</div>
<h2>扩展工具</h2>
<div class="code-block">
<div class="code-block-header"><span>~/.pi/agent/extensions/greet.ts</span><button type="button" class="icon-btn copy-btn" data-copy="import type { ExtensionAPI } from &quot;@earendil-works/pi-coding-agent&quot;;&#10;import { Type } from &quot;typebox&quot;;&#10;&#10;export default function (pi: ExtensionAPI) {&#10;  pi.registerTool({&#10;    name: &quot;greet&quot;,&#10;    description: &quot;Greet someone&quot;,&#10;    parameters: Type.Object({ name: Type.String() }),&#10;    async execute(_id, params) {&#10;      return { content: [{ type: &quot;text&quot;, text: \`Hello, \${params.name}!\` }], details: {} };&#10;    },&#10;  });&#10;}">Copy</button></div>
<pre><span class="cmd">export default function</span> (pi: ExtensionAPI) {
  pi.registerTool({
    name: <span class="cmd">"greet"</span>,
    description: <span class="cmd">"Greet someone"</span>,
    parameters: Type.Object({ name: Type.String() }),
    <span class="cmd">async</span> execute(_id, params) {
      <span class="cmd">return</span> { content: [{ type: <span class="cmd">"text"</span>, text: \`Hello, \${params.name}!\` }], details: {} };
    },
  });
}</pre>
</div>
<div class="callout"><div class="callout-icon">→</div><p>交互里也可用 <code>!command</code> 把 shell 输出注入上下文；<code>!!command</code> 只执行不进上下文。</p></div>`,
		},
		{
			id: "s03",
			sid: "s03",
			title: "Install & Auth",
			motto: "Ship the vehicle before tuning the engine",
			explain: "先能跑起来：Node、bash、登录、进项目目录。",
			stage: 1,
			concepts: ["/login", "auth.json", "Git Bash", "fnm"],
			figures: [
				{
					src: "images/s03-install-auth.png",
					alt: "Xiaohong follows the setup path from Node 22 and Git Bash to login and the first prompt",
					caption: "Windows 首次运行路径：准备 Node 与 Git Bash，安装 Pi，登录后发送第一条提示。",
					step: 1,
					width: 1168,
					height: 784,
				},
			],
			html: `
<p class="lead">Windows + fnm 最短路径如下。Pi 需要 Node ≥ 22.19 与 bash。</p>
<div class="code-block">
<div class="code-block-header"><span>install</span><button type="button" class="icon-btn copy-btn" data-copy="fnm install 22&#10;fnm use 22&#10;npm install -g --ignore-scripts @earendil-works/pi-coding-agent&#10;cd your-project&#10;pi">Copy</button></div>
<pre><span class="cmd">fnm install 22</span> && <span class="cmd">fnm use 22</span>
<span class="cmd">npm install -g --ignore-scripts @earendil-works/pi-coding-agent</span>
<span class="cmd">cd</span> your-project
<span class="cmd">pi</span></pre>
</div>
<h2>认证</h2>
<ul class="feature-list">
<li><span class="mark">A</span><span><code>/login</code> 订阅 OAuth（Claude / Codex / Copilot…）</span></li>
<li><span class="mark">B</span><span>API Key → 写入 <code>~/.pi/agent/auth.json</code> 或环境变量</span></li>
<li><span class="mark">C</span><span>自定义中转 → 优先 <code>models.json</code>（下一课），不必改 auth.json</span></li>
</ul>
<div class="callout warn"><div class="callout-icon">!</div><p>Windows 请安装 <strong>Git for Windows</strong>，否则 <code>bash</code> 工具不可用。可在 settings 里设 <code>shellPath</code>。</p></div>
<div class="table-wrap"><table>
<thead><tr><th>路径</th><th>用途</th></tr></thead>
<tbody>
<tr><td><code>~/.pi/agent/auth.json</code></td><td>内置 provider 凭据</td></tr>
<tr><td><code>~/.pi/agent/settings.json</code></td><td>主题、默认模型、trust 策略</td></tr>
<tr><td><code>~/.pi/agent/models.json</code></td><td>自定义 URL / model</td></tr>
</tbody></table></div>`,
		},
		{
			id: "s04",
			sid: "s04",
			title: "Models & Providers",
			motto: "Point the harness at any capable model",
			explain: "URL + Key + Model + API 协议，写进 models.json。",
			stage: 1,
			concepts: ["models.json", "baseUrl", "openai-responses", "openai-completions"],
			figures: [
				{
					src: "images/s04-models-providers.png",
					alt: "Xiaohong connects URL, key, model, and API protocol fields through models.json",
					caption: "自定义模型连接由 URL、Key、Model 与 API 协议共同决定。",
					step: 1,
					width: 1168,
					height: 784,
				},
			],
			html: `
<p class="lead">内置 catalog 覆盖主流厂商；中转 / 本地 / 私有部署用 <code>~/.pi/agent/models.json</code>。</p>
<div class="code-block">
<div class="code-block-header"><span>models.json · responses 协议示例</span><button type="button" class="icon-btn copy-btn" data-copy='{\n  "providers": {\n    "my-proxy": {\n      "baseUrl": "https://api.example.com/v1",\n      "api": "openai-responses",\n      "apiKey": "$MY_API_KEY",\n      "models": [\n        {\n          "id": "grok-4.5",\n          "name": "Grok 4.5",\n          "reasoning": true,\n          "input": ["text", "image"],\n          "contextWindow": 500000,\n          "maxTokens": 500000\n        }\n      ]\n    }\n  }\n}'>Copy</button></div>
<pre>{
  <span class="cmd">"providers"</span>: {
    <span class="cmd">"my-proxy"</span>: {
      <span class="cmd">"baseUrl"</span>: <span class="cmd">"https://api.example.com/v1"</span>,
      <span class="cmd">"api"</span>: <span class="cmd">"openai-responses"</span>,
      <span class="cmd">"apiKey"</span>: <span class="cmd">"$MY_API_KEY"</span>,
      <span class="cmd">"models"</span>: [{ <span class="cmd">"id"</span>: <span class="cmd">"grok-4.5"</span>, <span class="cmd">"reasoning"</span>: true, ... }]
    }
  }
}</pre>
</div>
<ul class="feature-list">
<li><span class="mark">·</span><span><code>api</code>：<code>openai-completions</code> | <code>openai-responses</code> | <code>anthropic-messages</code> | <code>google-generative-ai</code></span></li>
<li><span class="mark">·</span><span>打开 <code>/model</code> 会重载文件；可用 <code>settings.json</code> 设 <code>defaultProvider</code> / <code>defaultModel</code></span></li>
<li><span class="mark">·</span><span>自定义 provider 的 key 在 <code>models.json</code> 即可；<strong>不必</strong>为中转改 <code>auth.json</code></span></li>
</ul>
<div class="callout"><div class="callout-icon">※</div><p>使用 <code>openai-responses</code> 还是 <code>openai-completions</code>，由上游 API 实际支持的协议决定。</p></div>`,
		},
		{
			id: "s05",
			sid: "s05",
			title: "Sessions",
			motto: "History is a tree, not a tape",
			explain: "JSONL 会话可分支、恢复、导出——长任务的时间机器。",
			stage: 2,
			concepts: ["/tree", "/fork", "pi -c", "pi -r", "JSONL"],
			figures: [
				{
					src: "images/s05-sessions.png",
					alt: "Xiaohong stands beside a JSONL session tree with continue and fork paths",
					caption: "会话历史是一棵树：可以继续当前路径，也可以从节点恢复或 fork。",
					step: 1,
					width: 1168,
					height: 784,
				},
			],
			html: `
<p class="lead">每次对话落盘。你可以在树里回到任意节点，fork 出新分支，而不是只能线性 undo。</p>
<div class="grid-2">
<div class="card"><div class="card-title">Continue</div><p class="card-desc"><code>pi -c</code> 继续最近会话</p></div>
<div class="card"><div class="card-title">Resume</div><p class="card-desc"><code>pi -r</code> 浏览历史会话</p></div>
<div class="card"><div class="card-title">Tree</div><p class="card-desc">会话内 <code>/tree</code> 看分支结构</p></div>
<div class="card"><div class="card-title">Fork / Clone</div><p class="card-desc"><code>/fork</code> <code>/clone</code> 分叉实验</p></div>
</div>
<ul class="feature-list">
<li><span class="mark">·</span><span>会话存在 <code>~/.pi/agent/sessions/</code>（按项目隔离）</span></li>
<li><span class="mark">·</span><span>可导出 HTML / JSONL / gist，便于分享 OSS 轨迹</span></li>
<li><span class="mark">·</span><span>双 Esc 默认打开 tree（可在 settings 改）</span></li>
</ul>`,
		},
		{
			id: "s06",
			sid: "s06",
			title: "Context Files",
			motto: "Load knowledge on demand, not as a novel",
			explain: "AGENTS.md 是给模型的项目说明书——短、可执行、可继承。",
			stage: 2,
			concepts: ["AGENTS.md", "CLAUDE.md", "/reload", "~/.pi/agent/AGENTS.md"],
			figures: [
				{
					src: "images/s06-context-files.png",
					alt: "Xiaohong merges global, parent, and project context files into the agent loop",
					caption: "全局、父目录与当前项目的上下文文件在启动时合并进入 Agent Loop。",
					step: 1,
					width: 1168,
					height: 784,
				},
			],
			html: `
<p class="lead">Pi 启动时加载上下文文件，而不是把整个 wiki 塞进 system prompt。</p>
<div class="code-block">
<div class="code-block-header"><span>AGENTS.md</span><button type="button" class="icon-btn copy-btn" data-copy="# Project Instructions&#10;&#10;- Run npm run check after code changes&#10;- Do not run production migrations&#10;- Keep replies concise">Copy</button></div>
<pre><span class="comment"># Project Instructions</span>

- Run <span class="cmd">npm run check</span> after code changes
- Do not run production migrations
- Keep replies concise</pre>
</div>
<ul class="feature-list">
<li><span class="mark">·</span><span>全局：<code>~/.pi/agent/AGENTS.md</code></span></li>
<li><span class="mark">·</span><span>项目：当前与父目录的 <code>AGENTS.md</code> / <code>CLAUDE.md</code></span></li>
<li><span class="mark">·</span><span>改完 <code>/reload</code> 或重启 pi</span></li>
</ul>
<div class="quote">你在写的是 <strong>harness 知识层</strong>，不是在训练模型。写清楚边界与命令，比写长篇「角色扮演」有用。</div>`,
		},
		{
			id: "s07",
			sid: "s07",
			title: "TUI & Themes",
			motto: "The vehicle needs a dashboard, not a wallpaper app",
			explain: "Pi 是终端 TUI：可换配色主题，壁纸属于终端模拟器。",
			stage: 2,
			concepts: ["/settings", "theme", "pi-tui", "dark/light"],
			figures: [
				{
					src: "images/s07-tui-themes.png",
					alt: "Xiaohong compares the terminal background layer with Pi TUI theme colors",
					caption: "终端负责背景；Pi theme 负责 TUI 的文字、边框与组件配色。",
					step: 1,
					width: 1168,
					height: 784,
				},
			],
			html: `
<p class="lead">交互界面由 <code>pi-tui</code> 差分渲染。主题是 JSON 色板，不是桌面换肤。</p>
<ul class="feature-list">
<li><span class="mark">·</span><span><code>/settings</code> 切换 theme；内建 <code>dark</code> / <code>light</code></span></li>
<li><span class="mark">·</span><span>自定义：<code>~/.pi/agent/themes/*.json</code></span></li>
<li><span class="mark">·</span><span>改主题文件可热更新；壁纸请在 Windows Terminal 配置</span></li>
</ul>
<div class="callout"><div class="callout-icon">※</div><p>与 Codex 桌面 + Dream Skin 不同：Pi 没有整窗 GUI 背景层。要氛围感 → 终端背景 + Pi theme 配色配合。</p></div>`,
		},
		{
			id: "s08",
			sid: "s08",
			title: "Extensions",
			motto: "Hook around the loop, never rewrite the loop",
			explain: "事件、工具、命令、自定义 UI——扩展面就是 Pi 的产品差异。",
			stage: 3,
			concepts: ["ExtensionAPI", "pi.on", "registerCommand", "/reload", "-e"],
			figures: [
				{
					src: "images/s08-extensions.png",
					alt: "Xiaohong attaches extension hooks around an unchanged agent loop",
					caption: "Extension 在循环外围监听和拦截事件，不需要重写核心 loop。",
					step: 1,
					width: 1168,
					height: 784,
				},
			],
			html: `
<p class="lead">文档原话：Ask pi to build an extension for your use case。无需改源码。</p>
<div class="table-wrap"><table>
<thead><tr><th>位置</th><th>范围</th></tr></thead>
<tbody>
<tr><td><code>~/.pi/agent/extensions/</code></td><td>全局</td></tr>
<tr><td><code>.pi/extensions/</code></td><td>项目（需 trust）</td></tr>
<tr><td><code>pi -e ./x.ts</code></td><td>单次试验</td></tr>
</tbody></table></div>
<h2>能做什么</h2>
<ul class="feature-list">
<li><span class="mark">✓</span><span>生命周期事件：拦截危险 <code>bash</code>、自定义 compaction</span></li>
<li><span class="mark">✓</span><span><code>registerTool</code> / <code>registerCommand</code></span></li>
<li><span class="mark">✓</span><span><code>ctx.ui</code> 确认框、选择器、自定义 TUI 组件</span></li>
<li><span class="mark">✓</span><span>权限门、git checkpoint、todo、甚至游戏——examples 里都有</span></li>
</ul>
<div class="callout warn"><div class="callout-icon">!</div><p>扩展以你的系统权限运行。只装信任来源；项目扩展在 trust 之后才加载。</p></div>`,
		},
		{
			id: "s09",
			sid: "s09",
			title: "Skills & Templates",
			motto: "List first, expand when needed",
			explain: "Skills 按需注入知识；Prompt templates 是可复用的斜杠提示。",
			stage: 3,
			concepts: ["skills", "prompt templates", "/skill:name", "Agent Skills"],
			figures: [
				{
					src: "images/s09-skills-templates.png",
					alt: "Xiaohong expands one selected skill and injects it into context on demand",
					caption: "先暴露技能清单，需要时再展开正文并注入上下文。",
					step: 1,
					width: 1168,
					height: 784,
				},
			],
			html: `
<p class="lead">和把整本手册塞进 system prompt 相反，采用渐进式披露策略：先暴露清单，模型真正需要时再展开正文。</p>
<ul class="feature-list">
<li><span class="mark">·</span><span>Skills：领域流程 / 检查清单，可作 <code>/skill:name</code></span></li>
<li><span class="mark">·</span><span>Prompt templates：固定开场白、审查模板等</span></li>
<li><span class="mark">·</span><span>可放全局、项目或 pi package 分发</span></li>
</ul>
<div class="quote">Pi 刻意不内建 plan mode / todos——你可以用 skill、extension 或 package 按自己的方式实现。</div>`,
		},
		{
			id: "s10",
			sid: "s10",
			title: "Packages",
			motto: "Share the vehicle parts, not the whole factory",
			explain: "把 extensions / skills / themes 打成 npm 或 git 包，别人一行安装。",
			stage: 3,
			concepts: ["pi install", "pi update --extensions", "pi list", "pi config"],
			figures: [
				{
					src: "images/s10-packages.png",
					alt: "Xiaohong sends npm, git, and local packages through resource discovery into a Pi session",
					caption: "Package 来源经过资源发现与 settings 配置后，加载到 Pi 会话。",
					step: 1,
					width: 1168,
					height: 784,
				},
			],
			html: `
<div class="code-block">
<div class="code-block-header"><span>package management</span><button type="button" class="icon-btn copy-btn" data-copy="pi install npm:@foo/bar&#10;pi install git:github.com/user/repo&#10;pi list&#10;pi update --extensions&#10;pi config">Copy</button></div>
<pre><span class="cmd">pi install npm:@foo/bar</span>
<span class="cmd">pi install git:github.com/user/repo</span>
<span class="cmd">pi list</span>
<span class="cmd">pi update --extensions</span>
<span class="cmd">pi config</span>   <span class="comment"># enable/disable resources</span></pre>
</div>
<ul class="feature-list">
<li><span class="mark">·</span><span>默认写入用户 settings；<code>-l</code> 写项目 <code>.pi/settings.json</code></span></li>
<li><span class="mark">·</span><span><code>pi -e npm:@foo/bar</code> 临时试用，不永久安装</span></li>
<li><span class="mark">·</span><span>包可含 extensions、skills、prompts、themes</span></li>
</ul>`,
		},
		{
			id: "s11",
			sid: "s11",
			title: "Run Modes",
			motto: "Same core, four doors",
			explain: "交互、print、JSON、RPC/SDK——同一 harness，不同宿主。",
			stage: 4,
			concepts: ["interactive", "-p", "--mode json", "--mode rpc", "SDK"],
			figures: [
				{
					src: "images/s11-run-modes.png",
					alt: "Xiaohong shows interactive, print, JSON, and RPC or SDK doors around one Pi core",
					caption: "运行入口不同，但 Interactive、Print、JSON、RPC 与 SDK 共享同一个核心。",
					step: 1,
					width: 1168,
					height: 784,
				},
			],
			html: `
<div class="grid-2">
<div class="card"><div class="card-title">Interactive</div><p class="card-desc">默认 TUI。日常编码。</p><div class="card-meta">pi</div></div>
<div class="card"><div class="card-title">Print</div><p class="card-desc">单次任务，stdout 文本。</p><div class="card-meta">pi -p "…"</div></div>
<div class="card"><div class="card-title">JSON</div><p class="card-desc">结构化事件流，便于管道。</p><div class="card-meta">pi --mode json</div></div>
<div class="card"><div class="card-title">RPC / SDK</div><p class="card-desc">进程集成或嵌入应用（如 OpenClaw）。</p><div class="card-meta">--mode rpc · createAgentSession</div></div>
</div>
<div class="callout"><div class="callout-icon">→</div><p>库拆分：只要 LLM 层用 <code>pi-ai</code>；只要循环用 <code>pi-agent-core</code>；完整产品用 <code>pi-coding-agent</code>。</p></div>`,
		},
		{
			id: "s12",
			sid: "s12",
			title: "Architecture",
			motto: "Libraries first, product on top",
			explain: "Monorepo 分层：ai → agent-core → coding-agent + tui。",
			stage: 4,
			concepts: ["pi-ai", "pi-agent-core", "pi-tui", "pi-coding-agent", "orchestrator"],
			figures: [
				{
					src: "images/s12-architecture.png",
					alt: "Xiaohong assembles Pi AI, agent core, TUI, coding agent, and orchestrator layers",
					caption: "库层从 pi-ai 与 agent-core 向上组合，coding-agent 位于产品层。",
					step: 1,
					width: 1168,
					height: 784,
				},
			],
			html: `
<div class="pattern"><span class="hi">pi-orchestrator</span>  (experimental)
        │
<span class="hi">pi-coding-agent</span>  ← product: CLI / SDK / RPC
   ┌────┴────┐
<span class="hi">agent-core</span>   <span class="hi">pi-tui</span>
   │
<span class="hi">pi-ai</span>         ← providers, stream, auth</div>
<div class="table-wrap"><table>
<thead><tr><th>Package</th><th>Role</th></tr></thead>
<tbody>
<tr><td><code>@earendil-works/pi-ai</code></td><td>多 provider LLM API</td></tr>
<tr><td><code>@earendil-works/pi-agent-core</code></td><td>循环、状态、harness</td></tr>
<tr><td><code>@earendil-works/pi-tui</code></td><td>差分渲染 TUI</td></tr>
<tr><td><code>@earendil-works/pi-coding-agent</code></td><td>产品 <code>pi</code></td></tr>
<tr><td><code>@earendil-works/pi-orchestrator</code></td><td>实验性编排</td></tr>
</tbody></table></div>
<p>版本 lockstep；文档：<a href="https://pi.dev/docs/latest" target="_blank" rel="noopener">pi.dev/docs</a>。</p>`,
		},
		{
			id: "s13",
			sid: "s13",
			title: "Compaction",
			motto: "Context always fills up — make room",
			explain: "长会话靠 compaction；完整历史仍在 JSONL，可用 /tree 找回。",
			stage: 5,
			concepts: ["/compact", "auto-compaction", "lossy summary"],
			figures: [
				{
					src: "images/s13-compaction.png",
					alt: "Xiaohong compresses a full context stack into a summary while preserving full history",
					caption: "Compaction 用摘要腾出上下文空间；完整历史仍保存在会话记录中。",
					step: 1,
					width: 1168,
					height: 784,
				},
			],
			html: `
<p class="lead">Context 总会满。Pi 提供手动与自动 compaction；策略可用 extension 定制。</p>
<ul class="feature-list">
<li><span class="mark">·</span><span>压缩有损：摘要替换旧轮次，细节可能丢失</span></li>
<li><span class="mark">·</span><span>原始轨迹仍在会话文件；<code>/tree</code> 可回看节点</span></li>
<li><span class="mark">·</span><span>扩展可拦截 compact 流程，换模型总结或注入规则</span></li>
</ul>
<div class="quote">无限会话不是无限注意力——harness 的职责是<strong>腾地方</strong>，不是假装上下文无限。</div>`,
		},
		{
			id: "s14",
			sid: "s14",
			title: "Trust & Safety",
			motto: "Set boundaries first, then grant freedom",
			explain: "Pi 默认无内建权限弹窗；信任项目 + 沙箱/扩展 = 边界。",
			stage: 5,
			concepts: ["project trust", "trust.json", "containerization", "defaultProjectTrust"],
			figures: [
				{
					src: "images/s14-trust-safety.png",
					alt: "Xiaohong controls project trust, extension loading, skipping, and container isolation",
					caption: "项目资源在信任后加载；高风险执行应使用容器等外部隔离边界。",
					step: 1,
					width: 1168,
					height: 784,
				},
			],
			html: `
<p class="lead">设计选择：不把 permission UX 写死在核心。边界来自你的环境与扩展。</p>
<ul class="feature-list">
<li><span class="mark">·</span><span>含 <code>.pi/</code> 的项目会问 trust；决定写入 <code>trust.json</code></span></li>
<li><span class="mark">·</span><span>不信任则不加载项目扩展与项目 settings</span></li>
<li><span class="mark">·</span><span>强隔离：Docker / Gondolin / OpenShell（见 containerization 文档）</span></li>
<li><span class="mark">·</span><span>危险命令确认：自己写 extension 拦 <code>tool_call</code></span></li>
</ul>
<div class="callout warn"><div class="callout-icon">!</div><p>默认以当前用户权限运行。生产或不可信仓库请容器化，不要假设「agent 自己有权限系统」。</p></div>`,
		},
		{
			id: "s15",
			sid: "s15",
			title: "Philosophy",
			motto: "Adapt pi to your workflow — don't fork",
			explain: "最小核心 + 扩展面 = harness 工程。模型是司机，Pi 是车。",
			stage: 6,
			concepts: ["minimal core", "no fork", "harness engineering", "OSS sessions"],
			figures: [
				{
					src: "images/s15-philosophy.png",
					alt: "Xiaohong adds extension, skill, and package modules to a Pi car instead of forking it",
					caption: "模型负责驾驶；通过 extensions、skills 与 packages 改装 Pi，而不是 fork 核心。",
					step: 1,
					width: 1168,
					height: 784,
				},
			],
			html: `
<p class="lead">学完前面 14 课，回到产品哲学——这也是 Pi 与「全能 IDE Agent」的分水岭。</p>
<div class="grid-2">
<div class="card"><div class="card-title">刻意不做</div><p class="card-desc">内建 MCP、sub-agents、plan mode、todos、权限弹窗、background bash… 交给扩展或沙箱。</p></div>
<div class="card"><div class="card-title">刻意做好</div><p class="card-desc">循环、工具、会话树、多 provider、TUI、扩展 API、SDK/RPC、包分发。</p></div>
</div>
<div class="quote"><strong>Agency comes from the model. The harness gives agency a place to land.</strong><br/>Build the harness well. The model will do the rest.</div>
<ul class="feature-list">
<li><span class="mark">1</span><span>用 <code>models.json</code> 接任意模型</span></li>
<li><span class="mark">2</span><span>用 extensions / skills / packages 塑形工作流</span></li>
<li><span class="mark">3</span><span>用 sessions 积累真实轨迹；可选择公开 OSS sessions 反哺生态</span></li>
</ul>
<div class="link-strip">
<a class="btn primary" href="https://pi.dev/docs/latest" target="_blank" rel="noopener">pi.dev docs</a>
<a class="btn" href="https://github.com/earendil-works/pi" target="_blank" rel="noopener">GitHub</a>
<a class="btn" href="https://github.com/shareAI-lab/learn-claude-code" target="_blank" rel="noopener">learn-claude-code（姊妹教程思路）</a>
</div>`,
		},
	];

	/**
	 * Mermaid sources — labels with special chars MUST use double quotes:
	 * A["text with / ? : ~ +"]  and  D{"question?"}
	 */
	const MERMAIDS = {
		s01: {
			title: "流程图 · Agent Loop",
			src: `flowchart TD
  A["User prompt"] --> B["Append to messages"]
  B --> C["Call LLM with tools"]
  C --> D{"Has tool_use"}
  D -->|yes| E["Execute tools"]
  E --> F["Append tool_result"]
  F --> C
  D -->|no| G["Return text"]
  G --> H["End turn"]`,
		},
		s02: {
			title: "流程图 · Tool dispatch",
			src: `flowchart LR
  L["LLM"] -->|tool_call| D["Dispatch map"]
  D --> R["read"]
  D --> W["write"]
  D --> E["edit"]
  D --> B["bash"]
  D --> X["extension tools"]
  R --> TR["tool_result"]
  W --> TR
  E --> TR
  B --> TR
  X --> TR
  TR --> L`,
		},
		s03: {
			title: "流程图 · First run",
			src: `flowchart TD
  A["Install Node 22+"] --> B["npm install pi-coding-agent"]
  B --> C["Git Bash on Windows"]
  C --> D["cd project"]
  D --> E["Run pi"]
  E --> F["login command"]
  F --> G["OAuth subscription"]
  F --> H["API key"]
  G --> I["model picker"]
  H --> I
  I --> J["First prompt"]`,
		},
		s04: {
			title: "流程图 · Model resolution",
			src: `flowchart TD
  A["Request model"] --> B{"Source"}
  B -->|"built-in"| C["Provider catalog"]
  B -->|"custom"| D["models.json"]
  D --> E["baseUrl + api + models"]
  E --> F["apiKey env or auth"]
  C --> F
  F --> G{"Auth ok"}
  G -->|yes| H["Available in model list"]
  G -->|no| I["Listed but unavailable"]
  H --> J["Stream via API protocol"]`,
		},
		s05: {
			title: "流程图 · Session tree",
			src: `flowchart TD
  A["pi start"] --> B["Load or create session JSONL"]
  B --> C["Interactive turns"]
  C --> D["Persist entries"]
  D --> E["tree fork clone"]
  E --> F["Branch node"]
  F --> C
  C --> G["continue or resume"]
  G --> B`,
		},
		s06: {
			title: "流程图 · Context loading",
			src: `flowchart TD
  A["pi startup"] --> B["Global AGENTS.md"]
  A --> C["Parent dir context files"]
  A --> D["Cwd context files"]
  B --> E["Merge context"]
  C --> E
  D --> E
  E --> F["System and agent context"]
  F --> G["Agent loop"]
  H["reload command"] --> A`,
		},
		s07: {
			title: "流程图 · Theme layers",
			src: `flowchart TB
  subgraph TERM["Terminal"]
    TW["Terminal wallpaper colors"]
  end
  subgraph PITUI["Pi TUI"]
    TH["theme JSON"]
    UI["Components borders text"]
  end
  TW -.->|background| UI
  TH --> UI
  S["settings command"] --> TH`,
		},
		s08: {
			title: "流程图 · Extension hooks",
			src: `flowchart TD
  A["Session start"] --> B["Load extensions"]
  B --> C["Agent loop"]
  C --> D["tool_call event"]
  D --> E{"Extension handler"}
  E -->|block| F["Deny with reason"]
  E -->|allow| G["Execute tool"]
  G --> H["tool_result"]
  H --> C
  B --> I["registerTool registerCommand"]
  I --> C`,
		},
		s09: {
			title: "流程图 · On-demand skills",
			src: `flowchart LR
  A["Skill manifests list"] --> B["Model sees names"]
  B --> C{"Need skill"}
  C -->|yes| D["Expand skill body"]
  D --> E["Inject into context"]
  E --> F["Continue loop"]
  C -->|no| F
  T["Prompt template"] --> E`,
		},
		s10: {
			title: "流程图 · Package install",
			src: `flowchart TD
  A["pi install source"] --> B{"Source type"}
  B -->|npm| C["user agent npm dir"]
  B -->|git| D["user agent git dir"]
  B -->|path| E["Local path"]
  C --> F["Discover resources"]
  D --> F
  E --> F
  F --> G["Write settings.json"]
  G --> H["Load in session"]
  I["temp install flag"] --> F`,
		},
		s11: {
			title: "流程图 · Run modes",
			src: `flowchart TB
  CORE["pi-agent-core and pi-ai"]
  CORE --> MI["Interactive TUI"]
  CORE --> MP["Print mode"]
  CORE --> MJ["JSON mode"]
  CORE --> MR["RPC mode"]
  CORE --> MS["SDK embed"]
  MI --> USER["Human terminal"]
  MP --> CI["Scripts CI"]
  MJ --> PIPE["Pipelines"]
  MR --> HOST["Other process"]
  MS --> APP["Your app"]`,
		},
		s12: {
			title: "流程图 · Package layers",
			src: `flowchart BT
  AI["pi-ai"] --> AC["pi-agent-core"]
  AI --> CA["pi-coding-agent"]
  AC --> CA
  TUI["pi-tui"] --> CA
  CA --> OR["pi-orchestrator"]
  CA --> CLI["cli bin pi"]`,
		},
		s13: {
			title: "流程图 · Compaction",
			src: `flowchart TD
  A["Long messages"] --> B{"Context full"}
  B -->|no| C["Continue loop"]
  B -->|yes| D["Auto or compact"]
  D --> E["Summarize old turns"]
  E --> F["Replace with summary"]
  F --> G["JSONL keeps full history"]
  G --> H["tree can revisit"]
  F --> C`,
		},
		s14: {
			title: "流程图 · Project trust",
			src: `flowchart TD
  A["Enter project"] --> B{"Has project config"}
  B -->|no| C["User tools only"]
  B -->|yes| D{"Trusted already"}
  D -->|yes| E["Load project extensions"]
  D -->|no| F["Prompt trust"]
  F -->|trust| G["Save trust.json"]
  G --> E
  F -->|deny| H["Skip project resources"]
  E --> I["Agent loop"]
  H --> I
  C --> I
  J["Container sandbox"] -.-> I`,
		},
		s15: {
			title: "流程图 · Extend not fork",
			src: `flowchart LR
  M["Model agency"] --> H["Pi minimal core"]
  H --> E["Extensions"]
  H --> K["Skills templates"]
  H --> P["Packages"]
  H --> C["Custom models.json"]
  E --> W["Your workflow"]
  K --> W
  P --> W
  C --> W
  X["Fork internals"] -.->|avoid| H`,
		},
	};

	const HOME_ID = "home";
	const ALL_VIEWS = [{ id: HOME_ID, sid: "", title: "Home", motto: "Overview" }, ...LESSONS];

	/**
	 * Full-text search index: title/meta + stripped lesson body text.
	 * SEARCH_RAW keeps readable text for palette excerpts.
	 */
	const SEARCH_RAW = new Map();
	const SEARCH_INDEX = new Map();
	for (const l of LESSONS) {
		const div = document.createElement("div");
		div.innerHTML = l.html;
		const body = (div.textContent || "").replace(/\s+/g, " ").trim();
		const meta = `${l.sid} ${l.title} ${l.motto} ${l.explain} ${l.concepts.join(" ")}`;
		SEARCH_RAW.set(l.id, { meta, body });
		SEARCH_INDEX.set(l.id, `${meta} ${body}`.toLowerCase());
	}
	SEARCH_INDEX.set(HOME_ID, "home 首页 overview learn pi 教程 harness");

	function loadProgress() {
		try {
			return new Set(JSON.parse(localStorage.getItem(PROGRESS_KEY) || "[]"));
		} catch {
			return new Set();
		}
	}

	function saveProgress(set) {
		localStorage.setItem(PROGRESS_KEY, JSON.stringify([...set]));
	}

	let progress = loadProgress();

	function nextIncompleteLesson() {
		return LESSONS.find((l) => !progress.has(l.id)) || null;
	}

	function updateContinueCTA() {
		const btn = $("#continue-btn");
		const hint = $("#continue-hint");
		const progressNext = $("#progress-next");
		if (!btn) return;

		const done = LESSONS.filter((l) => progress.has(l.id)).length;
		const next = nextIncompleteLesson();

		if (done === 0) {
			btn.setAttribute("href", "#s01");
			btn.textContent = "Start s01 →";
			if (hint) {
				hint.hidden = true;
				hint.textContent = "";
			}
			if (progressNext) progressNext.textContent = "Start with s01";
			return;
		}

		if (!next) {
			btn.setAttribute("href", "#home");
			btn.textContent = "全部完成 · 回 Home";
			if (hint) {
				hint.hidden = false;
				hint.textContent = "15 课已完成。可从侧栏复习任意一课，或阅读官方文档继续深入。";
			}
			if (progressNext) progressNext.textContent = "All lessons complete";
			return;
		}

		btn.setAttribute("href", `#${next.id}`);
		btn.textContent = `Continue ${next.sid} · ${next.title} →`;
		if (hint) {
			hint.hidden = false;
			hint.textContent = `已完成 ${done} / ${LESSONS.length} · 下一课 ${next.sid}`;
		}
		if (progressNext) progressNext.textContent = `Next: ${next.sid} ${next.title}`;
	}

	function updateStageProgress() {
		const byStage = new Map();
		for (const l of LESSONS) {
			if (!byStage.has(l.stage)) byStage.set(l.stage, []);
			byStage.get(l.stage).push(l);
		}
		for (const [stage, list] of byStage) {
			const done = list.filter((l) => progress.has(l.id)).length;
			const el = $(`[data-stage-progress="${stage}"]`);
			if (el) {
				el.textContent = `${done}/${list.length}`;
				el.classList.toggle("complete", done === list.length && list.length > 0);
			}
			const stageEl = $(`.stage[data-stage="${stage}"]`);
			if (stageEl) {
				stageEl.classList.toggle("stage-complete", done === list.length && list.length > 0);
				// Highlight current stage (first incomplete)
				const next = nextIncompleteLesson();
				stageEl.classList.toggle("stage-current", Boolean(next && next.stage === stage));
			}
		}
	}

	function updateProgressUI() {
		const total = LESSONS.length;
		const done = LESSONS.filter((l) => progress.has(l.id)).length;
		const pct = total ? Math.round((done / total) * 100) : 0;
		const fill = $("#progress-fill");
		const label = $("#progress-label");
		if (fill) fill.style.width = `${pct}%`;
		if (label) label.textContent = `${done} / ${total}`;

		$$(".nav-item[data-nav]").forEach((el) => {
			const id = el.dataset.nav;
			el.classList.toggle("done", progress.has(id));
		});
		$$(".lesson-card").forEach((el) => {
			el.classList.toggle("done", progress.has(el.dataset.nav));
		});
		$$(".done-btn").forEach((btn) => {
			const id = btn.dataset.mark;
			const isDone = progress.has(id);
			btn.classList.toggle("is-done", isDone);
			btn.textContent = isDone ? "✓ 已完成" : "标记完成";
		});
		updateContinueCTA();
		updateStageProgress();
	}

	let toastTimer = 0;
	function showToast(message, { actionLabel, onAction } = {}) {
		const el = $("#toast");
		if (!el) return;
		el.hidden = false;
		el.replaceChildren();
		const text = document.createElement("span");
		text.textContent = message;
		el.appendChild(text);
		if (actionLabel && onAction) {
			const action = document.createElement("button");
			action.type = "button";
			action.className = "toast-action";
			action.textContent = actionLabel;
			action.addEventListener("click", () => {
				onAction();
				el.hidden = true;
			});
			el.appendChild(action);
		}
		window.clearTimeout(toastTimer);
		toastTimer = window.setTimeout(() => {
			el.hidden = true;
		}, 4200);
	}

	const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

	function scrollBehavior() {
		return reducedMotion.matches ? "auto" : "smooth";
	}

	/** Parse "#s08" or "#s08/heading-slug" into view id + in-page anchor suffix. */
	function parseHash() {
		let raw = location.hash.slice(1);
		try {
			raw = decodeURIComponent(raw);
		} catch {
			// Keep the raw hash when a malformed escape sequence is supplied.
		}
		const [viewPart, anchorPart] = raw.split("/");
		const view = ALL_VIEWS.some((v) => v.id === viewPart) ? viewPart : HOME_ID;
		return { view, anchor: anchorPart || "" };
	}

	function scrollToAnchor(viewId, anchor) {
		const el = document.getElementById(`${viewId}-${anchor}`);
		if (!el) return;
		el.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
	}

	function setView(
		id,
		{ renderDiagrams = true, anchor = "", manageFocus = true } = {},
	) {
		const valid = ALL_VIEWS.some((v) => v.id === id) ? id : HOME_ID;
		$$(".view").forEach((el) => el.classList.toggle("active", el.dataset.view === valid));
		$$(".nav-item").forEach((el) => el.classList.toggle("active", el.dataset.nav === valid));

		const meta = ALL_VIEWS.find((v) => v.id === valid);
		const crumb = $("#breadcrumb-current");
		if (crumb && meta) {
			crumb.textContent = meta.sid ? `${meta.sid} · ${meta.title}` : meta.title;
		}

		setSidebarOpen(false);
		updateOutline(valid, anchor);

		// Move focus to the destination so keyboard and screen-reader users
		// land on the new lesson/section after hash navigation.
		const destination = anchor
			? document.getElementById(`${valid}-${anchor}`)
			: $(`.view[data-view="${valid}"] h1`);
		if (manageFocus && destination) {
			destination.setAttribute("tabindex", "-1");
			destination.focus({ preventScroll: true });
		}

		// Mermaid cannot reliably measure SVG in display:none views — render only the active one.
		if (renderDiagrams) void renderMermaid({ force: false });

		if (anchor) {
			// Wait for diagrams to paint so the anchor position is stable.
			void mermaidRenderQueue.then(() => {
				requestAnimationFrame(() => scrollToAnchor(valid, anchor));
			});
		} else {
			window.scrollTo({ top: 0, behavior: scrollBehavior() });
		}
	}

	function navigateTo(view, anchor = "") {
		const nextHash = `#${view}${anchor ? `/${encodeURIComponent(anchor)}` : ""}`;
		if (location.hash === nextHash) syncFromURL();
		else location.hash = nextHash;
	}

	function syncFromURL({ manageFocus = true } = {}) {
		const { view, anchor } = parseHash();
		setView(view, { anchor, manageFocus });
	}

	function buildNav() {
		const section = $("#nav-lessons");
		if (!section) return;
		section.innerHTML = LESSONS.map(
			(l) => `
			<a class="nav-item" data-nav="${l.id}" href="#${l.id}">
				<span class="sid">${l.sid}</span>
				<span>${l.title}</span>
				<span class="check">✓</span>
			</a>`,
		).join("");
	}

	function diagramHtml(id) {
		const d = MERMAIDS[id];
		if (!d) return "";
		const panelId = `diagram-panel-${id}`;
		// Host filled by renderMermaid() so source never goes through HTML parse quirks
		return `
			<div class="diagram-wrap" data-mermaid-id="${id}">
				<div class="diagram-header">
					<button type="button" class="diagram-toggle" data-section-toggle aria-expanded="true" aria-controls="${panelId}">
						<span class="section-chevron" aria-hidden="true">▾</span>
						<span>${d.title}</span>
					</button>
					<div class="diagram-header-actions">
						<button type="button" class="icon-btn diagram-expand" data-diagram-expand aria-label="缩放 ${d.title}" title="聚焦查看，可放大或缩小">缩放 ↗</button>
					</div>
				</div>
				<div class="diagram-host" id="${panelId}"></div>
			</div>`;
	}

	function escapeHtml(str) {
		return String(str)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;");
	}

	/** Render per-lesson image tutorial strip (see assets/lessons/README.md). */
	function figuresHtml(lesson) {
		const figures = lesson.figures;
		if (!figures?.length) return "";
		const panelId = `tutorial-panel-${lesson.id}`;
		const items = figures
			.map((f, idx) => {
				const step = f.step ?? idx + 1;
				const src = assetUrl(f.src);
				const alt = escapeHtml(f.alt || "");
				const caption = escapeHtml(f.caption || "");
				const sizeAttrs =
					f.width && f.height ? ` width="${f.width}" height="${f.height}"` : "";
				return `
				<figure class="tutorial-figure" data-lightbox>
					<div class="tutorial-figure-frame" tabindex="0" role="button" aria-label="放大查看图片">
						<span class="tutorial-step">步骤 ${step}</span>
						<img src="${src}" alt="${alt}"${sizeAttrs} loading="lazy" decoding="async" />
					</div>
					${caption ? `<figcaption>${caption}</figcaption>` : ""}
				</figure>`;
			})
			.join("");
		return `
			<section class="tutorial-gallery" aria-label="图片教程">
				<div class="tutorial-gallery-header">
					<button type="button" class="tutorial-gallery-toggle" data-section-toggle aria-expanded="true" aria-controls="${panelId}">
						<span class="section-chevron" aria-hidden="true">▾</span>
						<span class="label">图片教程</span>
					</button>
					<span class="tutorial-gallery-meta">${figures.length} 张</span>
				</div>
				<div class="tutorial-gallery-grid" id="${panelId}">${items}</div>
			</section>`;
	}

	function buildLessons() {
		const host = $("#lessons-host");
		if (!host) return;
		host.innerHTML = LESSONS.map((l, i) => {
			const prev = i > 0 ? LESSONS[i - 1] : null;
			const next = i < LESSONS.length - 1 ? LESSONS[i + 1] : null;
			return `
			<section class="view" data-view="${l.id}" id="${l.id}">
				<div class="meta-row">
					<span class="badge accent">${l.sid}</span>
					<span class="badge">Stage ${l.stage}</span>
					${l.figures?.length ? `<span class="badge ok">图片教程 ${l.figures.length}</span>` : ""}
				</div>
				<h1>${l.title}</h1>
				<div class="motto">
					<div class="label">Motto</div>
					<blockquote>“${l.motto}”</blockquote>
					<p class="explain">${l.explain}</p>
				</div>
				<div class="concepts">${l.concepts.map((c) => `<span class="concept">${c}</span>`).join("")}</div>
				${diagramHtml(l.id)}
				${figuresHtml(l)}
				${l.html}
				<div class="lesson-actions">
					<button type="button" class="btn done-btn" data-mark="${l.id}">标记完成</button>
				</div>
				<div class="lesson-nav">
					${
						prev
							? `<a class="btn" href="#${prev.id}">← ${prev.sid} ${prev.title}</a>`
							: `<a class="btn ghost" href="#home">← Home</a>`
					}
					${
						next
							? `<a class="btn primary" href="#${next.id}">${next.sid} ${next.title} →</a>`
							: `<a class="btn primary" href="#home">回到 Home</a>`
					}
				</div>
			</section>`;
		}).join("");
	}

	function slugifyHeading(text, fallback) {
		const slug = text
			.normalize("NFKC")
			.toLowerCase()
			.replace(/[^\p{Letter}\p{Number}]+/gu, "-")
			.replace(/^-+|-+$/g, "");
		return slug || fallback;
	}

	function decorateHeadings() {
		$$('.view[data-view]').forEach((view) => {
			const viewId = view.dataset.view;
			const used = new Map();
			$$("h2, h3", view).forEach((heading, index) => {
				const base = slugifyHeading(heading.textContent.trim(), `section-${index + 1}`);
				const seen = used.get(base) || 0;
				used.set(base, seen + 1);
				const anchor = seen ? `${base}-${seen + 1}` : base;
				heading.id = `${viewId}-${anchor}`;
				heading.dataset.anchor = anchor;
				heading.setAttribute("tabindex", "-1");

				const link = document.createElement("a");
				link.className = "heading-anchor";
				link.href = `#${viewId}/${encodeURIComponent(anchor)}`;
				link.setAttribute("aria-label", `链接到“${heading.textContent.trim()}”`);
				link.textContent = "#";
				heading.appendChild(link);
			});
		});
	}

	function updateOutline(viewId, activeAnchor = "") {
		const outline = $("#page-outline");
		const list = $("#page-outline-list");
		const toggle = $("#outline-toggle");
		const view = $(`.view[data-view="${viewId}"]`);
		if (!outline || !list || !toggle || !view) return;

		const headings = $$("h2[data-anchor], h3[data-anchor]", view);
		outline.classList.remove("open");
		toggle.setAttribute("aria-expanded", "false");
		outline.hidden = headings.length === 0;
		toggle.hidden = headings.length === 0;
		if (!headings.length) {
			list.replaceChildren();
			return;
		}

		list.innerHTML = headings
			.map((heading) => {
				const anchor = heading.dataset.anchor;
				const title = heading.childNodes[0]?.textContent?.trim() || heading.textContent.trim();
				return `<a class="page-outline-link level-${heading.tagName.toLowerCase()} ${anchor === activeAnchor ? "active" : ""}" href="#${viewId}/${encodeURIComponent(anchor)}">${escapeHtml(title)}</a>`;
			})
			.join("");
	}

	const HOME_MERMAID = `flowchart LR
  U["User"] --> H["Pi Harness"]
  H --> M["LLM Model"]
  M -->|tool_use| H
  H -->|tool_result| M
  M -->|text| U
  H --> T["Tools"]
  H --> K["Knowledge"]
  H --> S["Sessions"]`;

	/** Track theme + which hosts already have SVG for that theme. */
	let mermaidThemeKey = "";
	const mermaidRendered = new WeakSet();
	/** Serialize renders — concurrent mermaid.run/render races detach nodes mid-draw. */
	let mermaidRenderToken = 0;
	let mermaidRenderQueue = Promise.resolve();

	function currentMermaidThemeKey() {
		return document.documentElement.dataset.theme === "light" ? "light" : "dark";
	}

	function configureMermaid() {
		const isDark = currentMermaidThemeKey() === "dark";
		mermaid.initialize({
			startOnLoad: false,
			theme: isDark ? "dark" : "default",
			securityLevel: "loose",
			fontFamily: "Inter, system-ui, sans-serif",
			flowchart: { curve: "basis", padding: 12, htmlLabels: true },
			themeVariables: isDark
				? {
						primaryColor: "#3d3570",
						primaryTextColor: "#dcddde",
						primaryBorderColor: "#7c6df0",
						lineColor: "#999999",
						secondaryColor: "#2a2a2a",
						tertiaryColor: "#252525",
						background: "#252525",
						mainBkg: "#2a2a2a",
						nodeBorder: "#7c6df0",
						clusterBkg: "#1e1e1e",
						titleColor: "#dcddde",
						edgeLabelBackground: "#252525",
					}
				: undefined,
		});
		mermaidThemeKey = currentMermaidThemeKey();
	}

	/**
	 * Render Mermaid diagrams for the active view only.
	 * Uses mermaid.render() (not run()) to avoid DOM detach races, and queues calls.
	 * @param {{ force?: boolean }} [opts]
	 */
	function renderMermaid({ force = false } = {}) {
		const token = ++mermaidRenderToken;
		mermaidRenderQueue = mermaidRenderQueue
			.then(() => renderMermaidNow(token, force))
			.catch((err) => console.warn("mermaid queue error:", err));
		return mermaidRenderQueue;
	}

	async function renderMermaidNow(token, force) {
		if (token !== mermaidRenderToken) return;
		if (typeof mermaid === "undefined") {
			console.warn("Local Mermaid bundle did not load — diagrams skipped.");
			return;
		}

		const themeKey = currentMermaidThemeKey();
		if (force || mermaidThemeKey !== themeKey) {
			configureMermaid();
		}

		// Only active view: display:none hosts can break measurement in some browsers.
		const wraps = $$(".view.active .diagram-wrap[data-mermaid-id]");
		const targets = wraps.length ? wraps : $$(".diagram-wrap[data-mermaid-id]");

		for (const wrap of targets) {
			if (token !== mermaidRenderToken) return;

			const id = wrap.dataset.mermaidId;
			const host = wrap.querySelector(".diagram-host");
			if (!host || host.hidden) continue;

			if (!force && mermaidRendered.has(host) && host.querySelector("svg")) continue;

			const src = id === "home" ? HOME_MERMAID : MERMAIDS[id]?.src;
			if (!src) continue;

			const uid = `mmd-${id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
			try {
				const { svg, bindFunctions } = await mermaid.render(uid, src.trim());
				if (token !== mermaidRenderToken) return;
				host.innerHTML = svg;
				bindFunctions?.(host);
				mermaidRendered.add(host);
			} catch (err) {
				console.warn(`mermaid render failed for ${id}:`, err);
				if (token !== mermaidRenderToken) return;
				host.innerHTML = `<p class="diagram-error">Diagram failed to render (${id}). Check console.</p>`;
			}
		}
	}

	function buildHomeLessons() {
		const grid = $("#home-lesson-grid");
		if (!grid) return;
		grid.innerHTML = LESSONS.map(
			(l) => `
			<a class="lesson-card" data-nav="${l.id}" href="#${l.id}">
				<span class="num">${l.sid}</span>
				<span class="body">
					<div class="title">${l.title}</div>
					<div class="mot">${l.motto}</div>
				</span>
			</a>`,
		).join("");
	}

	function toggleSection(button) {
		const panelId = button.getAttribute("aria-controls");
		const panel = panelId ? document.getElementById(panelId) : null;
		if (!panel) return;
		const willOpen = button.getAttribute("aria-expanded") !== "true";
		button.setAttribute("aria-expanded", willOpen ? "true" : "false");
		panel.hidden = !willOpen;
		if (willOpen && panel.classList.contains("diagram-host")) {
			void renderMermaid({ force: !panel.querySelector("svg") });
		}
	}

	let diagramZoom = 100;
	let diagramReturnFocus = null;
	const DIAGRAM_ZOOM_MIN = 10;
	const DIAGRAM_ZOOM_MAX = 150;
	const DIAGRAM_ZOOM_STEP = 10;

	function setDiagramZoom(nextZoom) {
		diagramZoom = Math.max(DIAGRAM_ZOOM_MIN, Math.min(DIAGRAM_ZOOM_MAX, nextZoom));
		const stage = $("#diagram-lightbox-stage");
		const value = $("#diagram-zoom-reset");
		if (stage) stage.style.setProperty("--diagram-zoom", `${diagramZoom}%`);
		if (value) {
			value.textContent = `${diagramZoom}%`;
			value.setAttribute("aria-label", `当前缩放 ${diagramZoom}%，点击恢复 100%`);
		}
		const zoomOut = $("#diagram-zoom-out");
		const zoomIn = $("#diagram-zoom-in");
		if (zoomOut) zoomOut.disabled = diagramZoom <= DIAGRAM_ZOOM_MIN;
		if (zoomIn) zoomIn.disabled = diagramZoom >= DIAGRAM_ZOOM_MAX;
	}

	function openDiagramLightbox(wrap, trigger) {
		const sourceSvg = wrap?.querySelector(".diagram-host svg");
		const box = $("#diagram-lightbox");
		const stage = $("#diagram-lightbox-stage");
		if (!sourceSvg || !box || !stage) {
			showToast("图表仍在加载，请稍后再试");
			return;
		}

		const clone = sourceSvg.cloneNode(true);
		clone.removeAttribute("style");
		clone.setAttribute("aria-hidden", "true");
		stage.replaceChildren(clone);
		const title = wrap.querySelector(".diagram-toggle span:last-child")?.textContent?.trim();
		const titleEl = $("#diagram-lightbox-title");
		if (titleEl) titleEl.textContent = title || "流程图";
		diagramReturnFocus = trigger || document.activeElement;
		setDiagramZoom(100);
		box.hidden = false;
		document.body.classList.add("diagram-lightbox-open");
		$("#diagram-lightbox-close")?.focus();
	}

	function closeDiagramLightbox() {
		const box = $("#diagram-lightbox");
		if (!box || box.hidden) return;
		box.hidden = true;
		$("#diagram-lightbox-stage")?.replaceChildren();
		document.body.classList.remove("diagram-lightbox-open");
		diagramReturnFocus?.focus?.();
		diagramReturnFocus = null;
	}

	function wireClicks(root = document) {
		root.addEventListener("click", (e) => {
			const currentHashLink = e.target.closest('a[href^="#"]');
			if (currentHashLink && currentHashLink.hash === location.hash) {
				e.preventDefault();
				syncFromURL();
				return;
			}

			const sectionToggle = e.target.closest("[data-section-toggle]");
			if (sectionToggle) {
				toggleSection(sectionToggle);
				return;
			}

			const diagramExpand = e.target.closest("[data-diagram-expand]");
			if (diagramExpand) {
				openDiagramLightbox(diagramExpand.closest(".diagram-wrap"), diagramExpand);
				return;
			}

			const lightboxFig = e.target.closest("[data-lightbox]");
			if (lightboxFig && e.target.closest("img, .tutorial-figure-frame")) {
				e.preventDefault();
				openLightbox(lightboxFig, lightboxFig.querySelector(".tutorial-figure-frame"));
				return;
			}

			const t = e.target.closest("[data-mark], [data-copy]");
			if (!t) return;
			if (t.dataset.mark) {
				const id = t.dataset.mark;
				const wasDone = progress.has(id);
				if (wasDone) progress.delete(id);
				else progress.add(id);
				saveProgress(progress);
				updateProgressUI();
				if (!wasDone) {
					const idx = LESSONS.findIndex((l) => l.id === id);
					const next = idx >= 0 && idx < LESSONS.length - 1 ? LESSONS[idx + 1] : null;
					if (next) {
						showToast(`已完成 ${id}`, {
							actionLabel: `下一课 ${next.sid} →`,
							onAction: () => navigateTo(next.id),
						});
					} else {
						showToast("全部课程已完成");
					}
				}
			}
			if (t.dataset.copy) {
				const text = t.dataset.copy;
				const done = () => {
					t.classList.add("copied");
					const prev = t.textContent;
					t.textContent = "Copied";
					setTimeout(() => {
						t.classList.remove("copied");
						t.textContent = prev;
					}, 1200);
				};
				if (navigator.clipboard?.writeText) {
					navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
				} else {
					fallbackCopy(text, done);
				}
			}
		});

		root.addEventListener("keydown", (e) => {
			const frame = e.target.closest(".tutorial-figure-frame");
			if (!frame || (e.key !== "Enter" && e.key !== " ")) return;
			e.preventDefault();
			openLightbox(frame.closest("[data-lightbox]"), frame);
		});
	}

	function fallbackCopy(text, onDone) {
		const ta = document.createElement("textarea");
		ta.value = text;
		ta.setAttribute("readonly", "");
		ta.style.position = "fixed";
		ta.style.left = "-9999px";
		document.body.appendChild(ta);
		ta.select();
		try {
			document.execCommand("copy");
			onDone?.();
		} finally {
			ta.remove();
		}
	}

	function trapDialogFocus(dialog, event) {
		if (event.key !== "Tab") return false;
		const focusable = $$(
			'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
			dialog,
		).filter((el) => !el.hidden && el.getClientRects().length > 0);
		if (!focusable.length) return false;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (event.shiftKey && document.activeElement === first) last.focus();
		else if (!event.shiftKey && document.activeElement === last) first.focus();
		else return false;
		event.preventDefault();
		return true;
	}

	// Lightbox for image tutorials
	let lightboxReturnFocus = null;
	function openLightbox(figureEl, trigger) {
		const img = figureEl.querySelector("img");
		const cap = figureEl.querySelector("figcaption");
		const box = $("#lightbox");
		const boxImg = $("#lightbox-img");
		const boxCap = $("#lightbox-caption");
		if (!box || !boxImg || !img) return;
		boxImg.src = img.currentSrc || img.src;
		boxImg.alt = img.alt || "";
		if (boxCap) boxCap.textContent = cap?.textContent?.trim() || img.alt || "";
		lightboxReturnFocus = trigger || document.activeElement;
		box.hidden = false;
		document.body.classList.add("lightbox-open");
		$("#lightbox-close")?.focus();
	}

	function closeLightbox() {
		const box = $("#lightbox");
		if (!box || box.hidden) return;
		box.hidden = true;
		const boxImg = $("#lightbox-img");
		if (boxImg) boxImg.removeAttribute("src");
		document.body.classList.remove("lightbox-open");
		lightboxReturnFocus?.focus?.();
		lightboxReturnFocus = null;
	}

	$("#lightbox-close")?.addEventListener("click", closeLightbox);
	$("#lightbox")?.addEventListener("click", (e) => {
		if (e.target === $("#lightbox") || e.target.classList.contains("lightbox-figure")) closeLightbox();
	});
	$("#diagram-lightbox-close")?.addEventListener("click", closeDiagramLightbox);
	$("#diagram-zoom-out")?.addEventListener("click", () =>
		setDiagramZoom(diagramZoom - DIAGRAM_ZOOM_STEP),
	);
	$("#diagram-zoom-in")?.addEventListener("click", () =>
		setDiagramZoom(diagramZoom + DIAGRAM_ZOOM_STEP),
	);
	$("#diagram-zoom-reset")?.addEventListener("click", () => setDiagramZoom(100));
	$("#diagram-lightbox-canvas")?.addEventListener(
		"wheel",
		(e) => {
			if (!e.ctrlKey && !e.metaKey) return;
			e.preventDefault();
			setDiagramZoom(
				diagramZoom + (e.deltaY < 0 ? DIAGRAM_ZOOM_STEP : -DIAGRAM_ZOOM_STEP),
			);
		},
		{ passive: false },
	);

	// Theme: "system" follows prefers-color-scheme until the user chooses otherwise.
	const systemTheme = window.matchMedia("(prefers-color-scheme: light)");
	let themePreference = localStorage.getItem(THEME_KEY);
	if (!["system", "light", "dark"].includes(themePreference)) themePreference = "system";

	function resolvedTheme(preference) {
		return preference === "system" ? (systemTheme.matches ? "light" : "dark") : preference;
	}

	function applyThemePreference(
		preference,
		{ persist = true, rerenderDiagrams = false } = {},
	) {
		themePreference = ["system", "light", "dark"].includes(preference)
			? preference
			: "system";
		const theme = resolvedTheme(themePreference);
		document.documentElement.dataset.theme = theme;
		document.documentElement.dataset.themePreference = themePreference;
		if (persist) localStorage.setItem(THEME_KEY, themePreference);
		const btn = $("#theme-toggle");
		if (btn) {
			const labels = { system: "系统", light: "浅色", dark: "深色" };
			btn.textContent = `主题 · ${labels[themePreference]}`;
			btn.setAttribute(
				"aria-label",
				`当前${labels[themePreference]}主题；点击切换主题模式`,
			);
		}
		const metaTheme = document.querySelectorAll('meta[name="theme-color"]');
		metaTheme.forEach((m) => {
			m.setAttribute("content", theme === "light" ? "#ffffff" : "#1e1e1e");
		});
		if (rerenderDiagrams) void renderMermaid({ force: true });
	}

	applyThemePreference(themePreference, { persist: false });
	systemTheme.addEventListener("change", (e) => {
		if (themePreference !== "system") return;
		applyThemePreference("system", { persist: false, rerenderDiagrams: true });
	});
	$("#theme-toggle")?.addEventListener("click", () => {
		const order = ["system", "light", "dark"];
		const next = order[(order.indexOf(themePreference) + 1) % order.length];
		applyThemePreference(next, { rerenderDiagrams: true });
	});

	// Responsive, collapsible, resizable sidebar
	const desktopSidebar = window.matchMedia("(min-width: 901px)");
	const app = $(".app");
	const sidebarResizer = $("#sidebar-resizer");
	const SIDEBAR_MIN = 220;
	const SIDEBAR_MAX = 420;
	const SIDEBAR_DEFAULT = 280;
	let sidebarCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
	let sidebarWidth = Number.parseInt(localStorage.getItem(SIDEBAR_WIDTH_KEY) || "", 10);
	if (!Number.isFinite(sidebarWidth)) sidebarWidth = SIDEBAR_DEFAULT;

	function setSidebarWidth(nextWidth, { persist = true } = {}) {
		sidebarWidth = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, Math.round(nextWidth)));
		document.documentElement.style.setProperty("--sidebar-w", `${sidebarWidth}px`);
		sidebarResizer?.setAttribute("aria-valuenow", String(sidebarWidth));
		if (persist) localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
	}

	function updateSidebarControls() {
		const mobileOpen = $(".sidebar")?.classList.contains("open") || false;
		const expanded = desktopSidebar.matches ? !sidebarCollapsed : mobileOpen;
		const toggle = $("#menu-toggle");
		if (toggle) {
			toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
			toggle.setAttribute("aria-label", expanded ? "隐藏侧栏" : "显示侧栏");
			toggle.title = expanded ? "隐藏侧栏" : "显示侧栏";
		}
	}

	function setSidebarCollapsed(collapsed, { persist = true } = {}) {
		sidebarCollapsed = Boolean(collapsed);
		app?.classList.toggle("sidebar-collapsed", sidebarCollapsed && desktopSidebar.matches);
		if (persist) localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
		updateSidebarControls();
	}

	function setSidebarOpen(open) {
		$(".sidebar")?.classList.toggle("open", open);
		$(".sidebar-overlay")?.classList.toggle("open", open);
		document.body.classList.toggle("sidebar-open", open);
		updateSidebarControls();
	}

	$("#menu-toggle")?.addEventListener("click", () => {
		if (desktopSidebar.matches) {
			setSidebarCollapsed(!sidebarCollapsed);
		} else {
			const open = !$(".sidebar")?.classList.contains("open");
			setSidebarOpen(open);
		}
	});
	$("#sidebar-collapse")?.addEventListener("click", () => setSidebarCollapsed(true));
	$(".sidebar-overlay")?.addEventListener("click", () => setSidebarOpen(false));
	$("#outline-toggle")?.addEventListener("click", () => {
		const outline = $("#page-outline");
		if (!outline) return;
		const open = outline.classList.toggle("open");
		$("#outline-toggle")?.setAttribute("aria-expanded", open ? "true" : "false");
		if (open) $("#page-outline-list a")?.focus();
	});
	$("#outline-close")?.addEventListener("click", () => {
		$("#page-outline")?.classList.remove("open");
		$("#outline-toggle")?.setAttribute("aria-expanded", "false");
		$("#outline-toggle")?.focus();
	});

	setSidebarWidth(sidebarWidth, { persist: false });
	setSidebarCollapsed(sidebarCollapsed, { persist: false });

	desktopSidebar.addEventListener("change", () => {
		setSidebarOpen(false);
		app?.classList.toggle("sidebar-collapsed", sidebarCollapsed && desktopSidebar.matches);
		updateSidebarControls();
	});

	if (sidebarResizer) {
		sidebarResizer.addEventListener("pointerdown", (e) => {
			if (!desktopSidebar.matches || sidebarCollapsed) return;
			e.preventDefault();
			sidebarResizer.setPointerCapture(e.pointerId);
			document.body.classList.add("sidebar-resizing");
		});
		sidebarResizer.addEventListener("pointermove", (e) => {
			if (!sidebarResizer.hasPointerCapture(e.pointerId)) return;
			setSidebarWidth(e.clientX, { persist: false });
		});
		sidebarResizer.addEventListener("pointerup", (e) => {
			if (!sidebarResizer.hasPointerCapture(e.pointerId)) return;
			sidebarResizer.releasePointerCapture(e.pointerId);
			document.body.classList.remove("sidebar-resizing");
			setSidebarWidth(sidebarWidth);
		});
		sidebarResizer.addEventListener("pointercancel", () => {
			document.body.classList.remove("sidebar-resizing");
			setSidebarWidth(sidebarWidth);
		});
		sidebarResizer.addEventListener("dblclick", () => setSidebarWidth(SIDEBAR_DEFAULT));
		sidebarResizer.addEventListener("keydown", (e) => {
			let next = sidebarWidth;
			if (e.key === "ArrowLeft") next -= 10;
			else if (e.key === "ArrowRight") next += 10;
			else if (e.key === "Home") next = SIDEBAR_MIN;
			else if (e.key === "End") next = SIDEBAR_MAX;
			else return;
			e.preventDefault();
			setSidebarWidth(next);
		});
	}

	// Progress jump → next incomplete
	$("#progress-jump")?.addEventListener("click", () => {
		const next = nextIncompleteLesson();
		navigateTo(next ? next.id : "s01");
	});

	// Stage collapse
	$$(".stage-toggle").forEach((btn) => {
		btn.addEventListener("click", () => {
			const stage = btn.closest(".stage");
			if (!stage) return;
			const collapsed = stage.classList.toggle("collapsed");
			btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
		});
	});

	// Filter
	function applyNavFilter() {
		const input = $("#nav-filter");
		const q = (input?.value || "").trim().toLowerCase();
		let visible = 0;
		$$("#nav-lessons .nav-item").forEach((item) => {
			const text = item.textContent.toLowerCase();
			const show = !q || text.includes(q);
			item.style.display = show ? "" : "none";
			if (show) visible += 1;
		});
		// Keep Home visible when filtering lessons
		const homeNav = $('.nav-item[data-nav="home"]');
		if (homeNav) homeNav.style.display = !q || "home".includes(q) ? "" : "none";
		const empty = $("#nav-filter-empty");
		if (empty) empty.hidden = !q || visible > 0;
	}

	$("#nav-filter")?.addEventListener("input", applyNavFilter);
	$("#nav-filter-clear")?.addEventListener("click", () => {
		const input = $("#nav-filter");
		if (input) input.value = "";
		applyNavFilter();
		input?.focus();
	});

	// Keyboard shortcut reference dialog
	let shortcutsReturnFocus = null;
	function openShortcuts() {
		const dialog = $("#shortcuts-backdrop");
		if (!dialog) return;
		shortcutsReturnFocus = document.activeElement;
		dialog.hidden = false;
		dialog.classList.add("open");
		document.body.classList.add("shortcuts-open");
		$("#open-shortcuts")?.setAttribute("aria-expanded", "true");
		$("#shortcuts-close")?.focus();
	}

	function closeShortcuts({ restoreFocus = true } = {}) {
		const dialog = $("#shortcuts-backdrop");
		if (!dialog || dialog.hidden) return;
		dialog.classList.remove("open");
		dialog.hidden = true;
		document.body.classList.remove("shortcuts-open");
		$("#open-shortcuts")?.setAttribute("aria-expanded", "false");
		if (restoreFocus) shortcutsReturnFocus?.focus?.();
		shortcutsReturnFocus = null;
	}

	$("#open-shortcuts")?.addEventListener("click", openShortcuts);
	$("#shortcuts-close")?.addEventListener("click", () => closeShortcuts());
	$("#shortcuts-backdrop")?.addEventListener("click", (e) => {
		if (e.target === $("#shortcuts-backdrop")) closeShortcuts();
	});
	$("#shortcuts-backdrop")?.addEventListener("keydown", (e) =>
		trapDialogFocus($("#shortcuts-backdrop"), e),
	);

	// Command palette + full-text lesson search
	const backdrop = $("#palette-backdrop");
	const paletteInput = $("#palette-input");
	const paletteList = $("#palette-list");
	let paletteReturnFocus = null;
	let focusIdx = 0;
	let filtered = [];

	const COMMANDS = [
		{
			id: "next-incomplete",
			title: "继续下一节未完成课程",
			hint: "导航",
			keywords: "next continue progress 下一课 继续",
			action: () => navigateTo(nextIncompleteLesson()?.id || "s01"),
		},
		{
			id: "toggle-complete",
			title: "标记当前课程完成 / 取消",
			hint: "M",
			keywords: "mark complete progress 完成 进度",
			action: () => {
				const current = parseHash().view;
				$(`.done-btn[data-mark="${current}"]`)?.click();
			},
		},
		{
			id: "cycle-theme",
			title: "切换主题模式",
			hint: "系统 → 浅色 → 深色",
			keywords: "theme system light dark 主题 系统 浅色 深色",
			action: () => $("#theme-toggle")?.click(),
		},
		{
			id: "system-theme",
			title: "主题跟随系统",
			hint: "外观",
			keywords: "theme system auto 主题 跟随 系统 自动",
			action: () => applyThemePreference("system", { rerenderDiagrams: true }),
		},
		{
			id: "toggle-sidebar",
			title: "显示 / 隐藏侧栏",
			hint: "布局",
			keywords: "sidebar navigation layout 侧栏 导航 隐藏",
			action: () => {
				if (desktopSidebar.matches) setSidebarCollapsed(!sidebarCollapsed);
				else setSidebarOpen(!$(".sidebar")?.classList.contains("open"));
			},
		},
		{
			id: "shortcuts",
			title: "查看键盘快捷键",
			hint: "?",
			keywords: "keyboard shortcuts help 快捷键 帮助",
			action: openShortcuts,
		},
	];

	function searchExcerpt(view, query) {
		const raw = SEARCH_RAW.get(view.id);
		if (!raw) return view.motto || "Overview";
		if (!query) return view.motto || raw.meta;
		const bodyLower = raw.body.toLowerCase();
		const position = bodyLower.indexOf(query);
		if (position < 0) return view.motto || raw.meta;
		const start = Math.max(0, position - 34);
		const end = Math.min(raw.body.length, position + query.length + 58);
		return `${start ? "…" : ""}${raw.body.slice(start, end)}${end < raw.body.length ? "…" : ""}`;
	}

	function filterPalette(query = "") {
		const normalized = query.trim().toLowerCase();
		const commandOnly = normalized.startsWith(">");
		const term = commandOnly ? normalized.slice(1).trim() : normalized;
		const commands = COMMANDS.filter((command) =>
			`${command.title} ${command.keywords}`.toLowerCase().includes(term),
		).map((command) => ({ ...command, type: "command" }));
		const views = commandOnly
			? []
			: ALL_VIEWS.filter((view) => !term || SEARCH_INDEX.get(view.id)?.includes(term)).map(
					(view) => ({
						...view,
						type: "view",
						hint: searchExcerpt(view, term),
					}),
				);
		filtered = [...commands, ...views];
		focusIdx = Math.min(focusIdx, Math.max(0, filtered.length - 1));
	}

	function executePaletteItem(item) {
		if (!item) return;
		closePalette();
		if (item.type === "command") item.action();
		else navigateTo(item.id);
	}

	function renderPalette({ scrollActive = false } = {}) {
		if (!paletteList || !paletteInput) return;
		if (!filtered.length) {
			paletteList.innerHTML = `<div class="palette-empty">没有匹配内容。试试课程名、正文关键词或 <code>&gt;</code> 命令。</div>`;
			paletteInput.removeAttribute("aria-activedescendant");
			return;
		}
		paletteList.innerHTML = filtered
			.map(
				(item, i) => `
			<button type="button" role="option" id="palette-option-${i}" aria-selected="${i === focusIdx}" class="palette-item ${i === focusIdx ? "focused" : ""}" data-palette-index="${i}">
				<span class="palette-item-main">
					<span class="palette-item-kind">${item.type === "command" ? "命令" : item.sid || "页面"}</span>
					<span class="palette-item-title">${escapeHtml(item.title)}</span>
				</span>
				<span class="hint">${escapeHtml(item.hint || item.motto || "")}</span>
			</button>`,
			)
			.join("");
		paletteInput.setAttribute("aria-activedescendant", `palette-option-${focusIdx}`);
		paletteList.querySelectorAll("[data-palette-index]").forEach((button) => {
			button.addEventListener("click", () => {
				executePaletteItem(filtered[Number(button.dataset.paletteIndex)]);
			});
		});
		if (scrollActive) {
			document.getElementById(`palette-option-${focusIdx}`)?.scrollIntoView({ block: "nearest" });
		}
	}

	function openPalette() {
		paletteReturnFocus = document.activeElement;
		if (backdrop) {
			backdrop.hidden = false;
			backdrop.classList.add("open");
		}
		$("#open-palette")?.setAttribute("aria-expanded", "true");
		focusIdx = 0;
		filterPalette();
		if (paletteInput) {
			paletteInput.value = "";
			paletteInput.setAttribute("aria-expanded", "true");
			paletteInput.focus();
		}
		renderPalette();
	}

	function closePalette({ restoreFocus = true } = {}) {
		if (backdrop) {
			backdrop.classList.remove("open");
			backdrop.hidden = true;
		}
		paletteInput?.setAttribute("aria-expanded", "false");
		$("#open-palette")?.setAttribute("aria-expanded", "false");
		paletteInput?.removeAttribute("aria-activedescendant");
		if (restoreFocus) paletteReturnFocus?.focus?.();
		paletteReturnFocus = null;
	}

	$("#open-palette")?.addEventListener("click", openPalette);
	backdrop?.addEventListener("click", (e) => {
		if (e.target === backdrop) closePalette();
	});
	backdrop?.addEventListener("keydown", (e) => trapDialogFocus(backdrop, e));
	paletteInput?.addEventListener("input", () => {
		focusIdx = 0;
		filterPalette(paletteInput.value);
		renderPalette();
	});
	paletteInput?.addEventListener("keydown", (e) => {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			focusIdx = Math.min(focusIdx + 1, filtered.length - 1);
			renderPalette({ scrollActive: true });
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			focusIdx = Math.max(focusIdx - 1, 0);
			renderPalette({ scrollActive: true });
		} else if (e.key === "Enter" && filtered[focusIdx]) {
			e.preventDefault();
			executePaletteItem(filtered[focusIdx]);
		} else if (e.key === "Escape") {
			e.preventDefault();
			closePalette();
		}
	});

	document.addEventListener("keydown", (e) => {
		const imageBox = $("#lightbox");
		if (imageBox && !imageBox.hidden) {
			if (e.key === "Escape") {
				e.preventDefault();
				closeLightbox();
			} else {
				trapDialogFocus(imageBox, e);
			}
			return;
		}

		const diagramBox = $("#diagram-lightbox");
		if (diagramBox && !diagramBox.hidden) {
			if (e.key === "Escape") closeDiagramLightbox();
			else if (e.key === "+" || e.key === "=")
				setDiagramZoom(diagramZoom + DIAGRAM_ZOOM_STEP);
			else if (e.key === "-") setDiagramZoom(diagramZoom - DIAGRAM_ZOOM_STEP);
			else if (e.key === "0") setDiagramZoom(100);
			else {
				trapDialogFocus(diagramBox, e);
				return;
			}
			e.preventDefault();
			return;
		}

		const shortcutsBox = $("#shortcuts-backdrop");
		if (shortcutsBox && !shortcutsBox.hidden) {
			if (e.key === "Escape") {
				e.preventDefault();
				closeShortcuts();
			} else {
				trapDialogFocus(shortcutsBox, e);
			}
			return;
		}

		const meta = e.metaKey || e.ctrlKey;
		if (meta && e.key.toLowerCase() === "k") {
			e.preventDefault();
			if (backdrop?.classList.contains("open")) closePalette();
			else openPalette();
			return;
		}
		if (e.key === "Escape") {
			closeDiagramLightbox();
			closeLightbox();
			closePalette();
			closeShortcuts();
			$("#page-outline")?.classList.remove("open");
			setSidebarOpen(false);
			return;
		}

		// Lesson navigation when not typing in an input
		const tag = (e.target?.tagName || "").toLowerCase();
		if (tag === "input" || tag === "textarea" || e.target?.isContentEditable) return;
		if (e.key === "?") {
			e.preventDefault();
			openShortcuts();
			return;
		}

		const activeId =
			$$(".view.active")[0]?.dataset.view || location.hash.slice(1) || HOME_ID;
		const idx = LESSONS.findIndex((l) => l.id === activeId);

		if (e.key === "ArrowRight") {
			if (activeId === HOME_ID) {
				e.preventDefault();
				navigateTo(LESSONS[0].id);
			} else if (idx >= 0 && idx < LESSONS.length - 1) {
				e.preventDefault();
				navigateTo(LESSONS[idx + 1].id);
			}
		} else if (e.key === "ArrowLeft") {
			if (idx > 0) {
				e.preventDefault();
				navigateTo(LESSONS[idx - 1].id);
			} else if (idx === 0) {
				e.preventDefault();
				navigateTo(HOME_ID);
			}
		} else if (e.key.toLowerCase() === "m" && idx >= 0) {
			e.preventDefault();
			const id = LESSONS[idx].id;
			if (progress.has(id)) progress.delete(id);
			else progress.add(id);
			saveProgress(progress);
			updateProgressUI();
		}
	});

	// Native anchors and browser history both converge on hashchange routing.
	window.addEventListener("hashchange", syncFromURL);

	let printClosedDetails = [];
	window.addEventListener("beforeprint", () => {
		printClosedDetails = $$(`.view.active details:not([open])`);
		printClosedDetails.forEach((detail) => detail.setAttribute("open", ""));
	});
	window.addEventListener("afterprint", () => {
		printClosedDetails.forEach((detail) => detail.removeAttribute("open"));
		printClosedDetails = [];
	});

	// Wait for deferred mermaid if needed
	function whenMermaidReady(cb, attempts = 40) {
		if (typeof mermaid !== "undefined") {
			cb();
			return;
		}
		if (attempts <= 0) {
			console.warn("Local Mermaid bundle did not load — diagrams skipped.");
			return;
		}
		setTimeout(() => whenMermaidReady(cb, attempts - 1), 50);
	}

	// Boot
	$$("[data-mod-kbd]").forEach((el) => {
		el.textContent = isApple ? "⌘K" : "Ctrl+K";
	});

	// Sync 404.html base if present (same meta)
	const baseMeta = document.querySelector('meta[name="site-base"]');
	if (baseMeta && !baseMeta.getAttribute("content")) {
		// Detect project pages path: /repo/ or /repo/index.html
		const path = location.pathname.replace(/\/index\.html?$/i, "/");
		const parts = path.split("/").filter(Boolean);
		// user.github.io → [] or [repo]; only set if single segment project site and not root
		if (parts.length === 1 && location.hostname.endsWith("github.io")) {
			baseMeta.setAttribute("content", `/${parts[0]}/`);
		}
	}

	buildNav();
	buildLessons();
	buildHomeLessons();
	decorateHeadings();
	wireClicks();
	$$('code, pre, .concept, .sid, .kbd').forEach((el) => el.setAttribute("translate", "no"));
	updateProgressUI();
	// Show the initial hash target without stealing focus on first paint.
	const initialRoute = parseHash();
	setView(initialRoute.view, {
		anchor: initialRoute.anchor,
		manageFocus: false,
		renderDiagrams: false,
	});
	whenMermaidReady(() => {
		void renderMermaid({ force: true }).then(() => {
			if (initialRoute.anchor) scrollToAnchor(initialRoute.view, initialRoute.anchor);
		});
	});

	const y = $("#year");
	if (y) y.textContent = String(new Date().getFullYear());
})();
